/* Copyright G. Hemingway, @2022 - All rights reserved */
"use strict";

const validPileMoves = {
  'ace': '2',
  '2': '3',
  '3': '4',
  '4': '5',
  '5': '6',
  '6': '7',
  '7': '8',
  '8': '9',
  '9': '10',
  '10':'jack',
  'jack': 'queen',
  'queen': 'king',
};

const validStackMoves = {
  '2': 'ace',
  '3': '2',
  '4': '3',
  '5': '4',
  '6': '5',
  '7': '6',
  '8': '7',
  '9': '8',
  '10': '9',
  'jack': '10',
  'queen': 'jack',
  'king': 'queen'
};

const suitsOrder = {'stack1': 'hearts', 'stack2': 'diamonds', 'stack3': 'clubs', 'stack4': 'spades'};

const shuffleCards = (includeJokers = false) => {
  /* Return an array of 52 cards (if jokers is false, 54 otherwise). Carefully follow the instructions in the README */
  let cards = [];
  ["spades", "clubs", "hearts", "diamonds"].forEach((suit) => {
    ["ace", 2, 3, 4, 5, 6, 7, 8, 9, 10, "jack", "queen", "king"].forEach(
      (value) => {
        cards.push({ suit: suit, value: value });
      }
    );
  });
  // Add in jokers here
  if (includeJokers) {
    /*...*/
  }
  // Now shuffle
  let deck = [];
  while (cards.length > 0) {
    // Find a random number between 0 and cards.length - 1
    const index = Math.floor(Math.random() * cards.length);
    deck.push(cards[index]);
    cards.splice(index, 1);
  }
  return deck;
};

const initialState = () => {
  /* Use the above function.  Generate and return an initial state for a game */
  let state = {
    pile1: [],
    pile2: [],
    pile3: [],
    pile4: [],
    pile5: [],
    pile6: [],
    pile7: [],
    stack1: [],
    stack2: [],
    stack3: [],
    stack4: [],
    draw: [],
    discard: [],
  };

  // Get the shuffled deck and distribute it to the players
  const deck = shuffleCards(false);
  // Setup the piles
  for (let i = 1; i <= 7; ++i) {
    let card = deck.splice(0, 1)[0];
    card.up = true;
    state[`pile${i}`].push(card);
    for (let j = i + 1; j <= 7; ++j) {
      card = deck.splice(0, 1)[0];
      card.up = false;
      state[`pile${j}`].push(card);
    }
  }
  // Finally, get the draw right
  state.draw = deck.map((card) => {
    card.up = false;
    return card;
  });
  return state;
};

const filterGameForProfile = (game) => ({
  active: game.active,
  score: game.score,
  won: game.won,
  id: game._id,
  game: "klondyke",
  start: game.start,
  state: game.state,
  moves: game.moves,
  winner: game.winner,
  drawCount: game.drawCount
});

const filterMoveForResults = (move) => ({
  ...move,
});

const isValid = (suit, value, dst) => {
  if (dst.length === 0) {
    if (dst.indexOf("pile") !== -1)
      return value === 'king';
    else {
      return value === "ace";
    }
  } else {
    let top = dst[dst.length - 1];
    if (top.value !== validPileMoves[value]){
      return false;
    } else if ((suit === 'spades' || suit === 'clubs') && (top.suit === 'spades' || top.suit === 'clubs')){
      return false;
    } else if ((suit === 'hearts' || suit === 'diamonds') && (top.suit === 'hearts' || top.suit === 'diamonds')){
      return false;
    } else {
      return true;
    }
  }
};

const validateMove = (state, request, drawCount) => {
  const error = {error: "invalid move"};
  let reqSuit = request.cards[0].suit;
  let reqVal = request.cards[0].value;

  const srcPile = state[request.src];
  const dstPile = state[request.dst];

  if (request.src === 'draw') {
    if (request.dst !== 'discard') {
      return {error: "draw cards MUST go to discard pile"};
    } else {
      let drawn = [];
      if (drawCount === 1) {
        let cardToMove = state[request.src].pop();
        cardToMove.up = true;
        state[request.dst].push(cardToMove);
        drawn.push(cardToMove);
      } else if (drawCount === 3) {
        for (let i = 0; i < 3; i++) {
          let cardToMove = state[request.src].pop();
          cardToMove.up = true;
          state[request.dst].push(cardToMove);
          drawn.push(cardToMove);
        }
      }
      return {state: state, drawCards: drawn};
    }
  }

  else if (request.dst.indexOf('stack') !== -1) {   // dst is a stack
    const topCard = srcPile[srcPile.length - 1];
    if (topCard.value !== reqVal || topCard.suit !== reqSuit) {  // check if card is on top
      return {error: 'cannot move more than one card to stack'};
    }
    else if (reqSuit !== suitsOrder[request.dst]) {
      return {error: 'wrong stack, suit order is: H, D, C, S'};
    }
    else if ((dstPile.length === 0 && reqVal !== "ace")
            || (dstPile.length !== 0
            && dstPile[dstPile.length - 1].value !== validStackMoves[reqVal])) {
      return {error: 'card not consecutive number'};
    }
    else {
    let cardToMove = state[request.src].pop();
    if (state[request.src].length !== 0) {
      state[request.src][state[request.src].length - 1].up = true;
    }
      state[request.dst].push(cardToMove);
    return state;
    }
  }

  else if (request.dst.indexOf('pile') !== -1) { // destination is pile

    if (!isValid(reqSuit, reqVal, dstPile)) {
      return {error: 'card does not have alternating color and consecutive number'};
    }
    if (request.src.indexOf('pile') !== -1) {   // pile to pile
      let index = 0;
      for (let i = 0; i < state[request.src].length; ++i) {
        let temp = state[request.src][i];
        if (temp.suit === reqSuit && temp.value === reqVal) {
          index = i;
          break;
        }
      }

      state[request.dst] = state[request.dst].concat(state[request.src].slice(index));

      state[request.src] = state[request.src].slice(0, index);
          if(state[request.src].length !== 0) {
            state[request.src][state[request.src].length - 1].up = true;
      }

      return state;
    }

    else {  // non-pile to pile
      if (srcPile[srcPile.length - 1].suit !== reqSuit || srcPile[srcPile.length - 1].value !== reqVal){
        return {error: 'Wrong card, not matched'};
      }

      const cardToMove = state[request.src].pop();
      state[request.dst].push(cardToMove);

    return state;
    }
  }

  else {
    return error;
  }
  
};

module.exports = {
  shuffleCards: shuffleCards,
  initialState: initialState,
  filterGameForProfile: filterGameForProfile,
  filterMoveForResults: filterMoveForResults,
  validateMove: validateMove
};
