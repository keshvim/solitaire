/* Copyright G. Hemingway, @2022 - All rights reserved */
"use strict";

const Joi = require("joi");
const {
  initialState,
  shuffleCards,
  filterGameForProfile,
  filterMoveForResults,
  validateMove
} = require("../../solitare.cjs");

module.exports = (app) => {
  /**
   * Create a new game
   *
   * @param {req.body.game} Type of game to be played
   * @param {req.body.color} Color of cards
   * @param {req.body.draw} Number of cards to draw
   * @return {201 with { id: ID of new game }}
   */
  app.post("/v1/game", async (req, res) => {
    if (!req.session.user)
      return res.status(401).send({ error: "unauthorized" });

    // Schema for user info validation
    const schema = Joi.object({
      game: Joi.string().lowercase().required(),
      color: Joi.string().lowercase().required(),
      draw: Joi.any(),
    });
    // Validate user input
    try {
      const data = await schema.validateAsync(req.body, { stripUnknown: true });
      // Set up the new game
      let newGame = {
        owner: req.session.user._id,
        active: true,
        cards_remaining: 52,
        color: data.color,
        game: data.game,
        score: 0,
        start: Date.now(),
        winner: "",
        state: [],
        moves: []
      };
      switch (data.draw) {
        case "Draw 1":
          newGame.drawCount = 1;
          break;
        case "Draw 3":
          newGame.drawCount = 3;
          break;
        default:
          newGame.drawCount = 1;
      }
      console.log(newGame);
      // Generate a new initial game state
      newGame.state = initialState();
      let game = new app.models.Game(newGame);
      try {
        await game.save();
        const query = { $push: { games: game._id } };
        // Save game to user's document too
        await app.models.User.findByIdAndUpdate(req.session.user._id, query);
        res.status(201).send({ id: game._id });
      } catch (err) {
        console.log(`Game.create save failure: ${err}`);
        res.status(400).send({ error: "failure creating game" });
      }
    } catch (err) {
      console.log(err);
      const message = err.details[0].message;
      console.log(`Game.create validation failure: ${message}`);
      res.status(400).send({ error: message });
    }
  });

  /**
   * Fetch game information
   *
   * @param (req.params.id} Id of game to fetch
   * @return {200} Game information
   */
  app.get("/v1/game/:id", async (req, res) => {
    try {
      let game = await app.models.Game.findById(req.params.id).populate("moves").exec();
      if (!game) {
        res.status(404).send({ error: `unknown game: ${req.params.id}` });
      } else {
        const state = game.state.toJSON();
        let results = filterGameForProfile(game);
        results.start = Date.parse(results.start);
        results.cards_remaining =
          52 -
          (state.stack1.length +
            state.stack2.length +
            state.stack3.length +
            state.stack4.length);
        // Do we need to grab the moves
        if (req.query.moves === "") {
          const moves = game.moves;
          let usr = await app.models.User.findById(moves[0].user);
          moves.map((move) => {
            move.player = usr.username;
            let srcCard = `${move.cards[0].value} of ${move.cards[0].suit}`
            let dstPile = ``
            if (move.dst.indexOf("stack") !== -1) {
              dstPile = `F${move.dst.slice(-1)}`
            } else if (move.dst.indexOf("pile") !== -1) {
              dstPile = `T${move.dst.slice(-1)}`
            } else {
              dstPile = move.dst
            }
            move.move = `${srcCard} to ${dstPile}`
            move.date = Date.parse(move.date);
          });
          state.moves = moves.map((move) => filterMoveForResults(move));
        }
        res.status(200).send(Object.assign({}, results, state));
      }
    } catch (err) {
      console.log(`Game.get failure: ${err}`);
      res.status(404).send({ error: `unknown game: ${req.params.id}` });
    }
  });

  
  app.put("/v1/game/:id", async (req, res) => {
    if (req.body.player === "") {   // don't want to get logged out mid-game
      return res.status(401).send({ error: "unauthorized: not logged in" });
    }

    let currentGame = await app.models.Game.findById(req.params.id).populate("owner").populate("state").exec();
    if (!currentGame) {
      return res.status(404).send({ error: `unknown game: ${req.params.id}` });
    // } else if (!currentGame.owner.equals(req.session.user._id)) {
    } else if (currentGame.owner.username !== req.body.player) {
      return res.status(401).send({ error: `unauthorized: not game owner, owner.username=${currentGame.owner.username}, player=${req.body.player}` });
    }
    let newState = currentGame.state.toJSON();

    if (req.body.active !== undefined) {
      currentGame.active = req.body.active;
      currentGame.end = Date.now();
      if (req.body.winner !== undefined) {
        currentGame.winner = req.body.winner;
      }
      await currentGame.save();
      return res.status(200).send(currentGame);
    }

    if (req.body.src === "discard" && req.body.dst === "draw" && newState.draw.length === 0) {
      if (newState.discard.length !== 0) {
        while (newState.discard.length !== 0) {
          let top = newState.discard.pop();
          top.up = false;
          newState.draw.push(top);
        }

        let newMove = {
          user: currentGame.owner._id,
          cards: req.body.cards,
          src: req.body.src,
          dst: req.body.dst,
          player: currentGame.owner.username
        }

        let move = new app.models.Move(newMove);

        try {
          await move.save();

        } catch (err) {
          console.log("Move.create failed");
        }

        currentGame.moves.push(move._id);
        currentGame.state = newState;
        await currentGame.save();
        return res.status(200).send(newState);
      }
      return res.status(400).send({error: "no more cards to draw"});
    }

    if (!(req.body.cards[0].up) && req.body.src !== 'draw') {
      return res.status(400).send({error: "cannot move face down card"});
    }

    const validState = validateMove(newState, req.body, currentGame.drawCount);
    if (validState.error !== undefined) {
      if (req.body.moveType === undefined) {
        return res.status(400).send({error: validState.error});
      }
      return res.status(400).send();
    } else if (validState.drawCards !== undefined) {
      let newMove = {
        user: currentGame.owner._id,
        cards: req.body.cards,
        src: req.body.src,
        dst: req.body.dst,
      }

      let move = new app.models.Move(newMove);

      try {
        await move.save();
      } catch (err) {
        console.log("Move.create failed");
      }

      currentGame.state = validState.state;
      currentGame.moves.push(move._id);
      await currentGame.save();
      return res.status(200).send({state: validState.state, drawCards: validState.drawCards});
    } else {

      let newMove = {
        user: currentGame.owner._id,
        cards: req.body.cards,
        src: req.body.src,
        dst: req.body.dst,
      }

      let move = new app.models.Move(newMove);

      try {
        await move.save();
      } catch (err) {
        console.log("Move.create failed");
      }
      
      currentGame.state = validState;
      currentGame.moves.push(move._id);
      await currentGame.save();
      return res.status(200).send(validState);
    }
  });

  // Provide end-point to request shuffled deck of cards and initial state - for testing
  app.get("/v1/cards/shuffle", (req, res) => {
    res.send(shuffleCards(false));
  });
  app.get("/v1/cards/initial", (req, res) => {
    res.send(initialState());
  });
};
