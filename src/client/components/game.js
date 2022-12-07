/* Copyright G. Hemingway, @2022 - All rights reserved */
"use strict";

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Pile } from "./pile.js";
import { ModalNotify, FormButton } from "./shared.js"

const CardRow = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: flex-start;
  margin-bottom: 2em;
`;

const CardRowGap = styled.div`
  flex-grow: 2;
`;

const GameBase = styled.div`
  grid-row: 2;
  grid-column: sb / main;
  height: 150%;
`;

export const Game = (props) => {
  const { id } = useParams();
  let [state, setState] = useState({
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
    gameOver: false,
    active: true
  });
  let [target, setTarget] = useState({id: '', pile: '', cards: []});
  // let [startDrag, setStartDrag] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const getGameState = async () => {
      const response = await fetch(`/v1/game/${id}`);
      const data = await response.json();
      let gameOver = checkGameOver(data.state);
      setState({
        pile1: data.pile1,
        pile2: data.pile2,
        pile3: data.pile3,
        pile4: data.pile4,
        pile5: data.pile5,
        pile6: data.pile6,
        pile7: data.pile7,
        stack1: data.stack1,
        stack2: data.stack2,
        stack3: data.stack3,
        stack4: data.stack4,
        draw: data.draw,
        discard: data.discard,
        gameOver: gameOver,
        active: data.active
      });

      window.addEventListener("keydown", function onPress(event) {
        if (event.key === "Escape") {
          onEsc(event);
        }
      }, false);
    };

    try {
      getGameState();
    } catch (err) {
      conole.log("ERROR: Could not mount - ", err);
    }
  }, [id, target]);

  const onClick = async (ev, pile) => {
    ev.stopPropagation();

    if (state[pile].length === 0) {
      if (pile === 'draw') {
        if (target.id === "" && target.pile === "" && target.cards.length === 0) {
          const data = {
            cards: state["discard"],
            src: 'discard',
            dst: 'draw',
            player: props.user.username
          };
          let res = await updateGameState(data);
          if (!res.error) {
            console.log(data);
          } else {
            console.log(res.error)
          }
      }
      } else if (target.id === "" && target.pile === "" && target.cards.length === 0) { // stack empty, not draw but no card currently selected
        return;
      } else {  // stack empty, not draw but card target currently exists
        let cardIndex = state[target.pile].findIndex(function(card) {
          return (card.suit === target.id.slice(0, target.id.indexOf(":")) && card.value === target.id.slice(target.id.indexOf(':') + 1));
        });
        
        let cardsToMove = state[target.pile].slice(cardIndex);

        const data = {
          cards: cardsToMove,
          src: target.pile,
          dst: pile,
          player: props.user.username
        };

        let res = await updateGameState(data);
        if (!res.error) {
          console.log(data);
        } else {
          console.log(res.error)
        }

      }

      setTarget({
        id:'',
        pile: '',
        cards: []
      });

    } else {    // stack not empty

      if (target.id === "" && target.pile === "" && target.cards.length === 0) {  // first click

        setTarget({
          id: ev.target.id,
          pile: pile,
          cards: state[pile]
        });

        if (pile === "draw") {
          const data = {
            cards: state["draw"].slice(-1),
            src: 'draw',
            dst: 'discard',
            player: props.user.username
          };

          let res = await updateGameState(data);
          if (!res.error) {
            console.log({
              cards: res.drawCards,
              src: 'draw',
             dst: 'discard'
            })
          } else {
            console.log(res.error)
          }

          setTarget({
            id:'',
            pile: '',
            cards: []
          });
        }

      } else {  // second click
        if (ev.target.id === target.id) {
          return;
        } else if (pile === "draw") {
          return;
        }

        let cardIndex = state[target.pile].findIndex(function(card) {
          return (card.suit === target.id.slice(0, target.id.indexOf(":")) && card.value === target.id.slice(target.id.indexOf(':') + 1));
        });
        
        let cardsToMove = state[target.pile].slice(cardIndex);

        const data = {
          cards: cardsToMove,
          src: target.pile,
          dst: pile,
          player: props.user.username
        };

        let res = await updateGameState(data);
        if (!res.error) {
          console.log(data)
        } else {
          console.log(res.error)
        }

        setTarget({
          id:'',
          pile: '',
          cards: []
        });
      }
  }
  };

  const updateGameState = async (data) => {
    let response = await fetch( `/v1/game/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  };

  const onEsc = (ev) => {
    let evTargetId = ev.target.id;
    if (evTargetId === "" && target.id !== "") {
        setTarget({
          id: "",
          pile: "",
          cards: []
        });
    }
  }

  const autoComplete = async (ev) => {
    ev.preventDefault();
    let prevMoveValid = true;
    while (prevMoveValid) {
      prevMoveValid = false;
      for (let i = 1; i <= 8; ++i) {
        let srcPileName = i < 8 ? `pile${i}` : `discard`;
        let srcPile = state[srcPileName];
        let srcCards = srcPile.slice(-1);

        setTarget({
          id: srcCards.id,
          pile: srcPileName,
          cards: srcPile
        });

        for (let j = 1; j <= 4; ++j) {

          if (pileToStackMove(state, srcCards, `stack${j}`)) {

            let res = await updateGameState({
              cards: srcCards,
              src: i < 8 ? `pile${i}` : "discard",
              dst: `stack${j}`,
              player: props.user.username,
              moveType: "auto"
            });

            if (res.error === undefined) {
              setTarget({
                id: "",
                pile: "",
                cards: []
              });

              prevMoveValid = true;
              break;
            }
          }
        }
      }
    }

    setTarget({
      id: "",
      pile: "",
      cards: []
    });
  }

const checkGameOver = (state) => {
  if (state["draw"].length !== 0) {
    return false;
  }

  for (let i = 1; i <= 8; ++i) {
    let srcPile = i < 8 ? state[`pile${i}`] : state.discard;
    let srcCards = srcPile.slice(-1);
    for (let j = 1; j <= 4; ++j) {
      if (pileToStackMove(state, srcCards, `stack${j}`)) {
        return false;
      }
    }
  }
  return true;
}

const checkWin = () => {
  return state.stack1.length === 13 && state.stack2.length === 13
    && state.stack3.length === 13 && state.stack4.length === 13;
}

const pileToStackMove = (state, srcCards, dstStackName) => {
  if (srcCards.length === 0) {
      return false;
  }

  let dstStack = state[dstStackName];
  let srcCard = srcCards[0];

  if (dstStackName.indexOf("1") !== -1 && srcCard.suit !== "hearts") {
    return false;
  } else if (dstStackName.indexOf("2") !== -1 && srcCard.suit !== "diamonds") {
    return false;
  } else if (dstStackName.indexOf("3") !== -1 && srcCard.suit !== "clubs") {
    return false;
  } else if (dstStackName.indexOf("4") !== -1 && srcCard.suit !== "spades") {
    return false;
  }

  if (dstStack.length === 0) {
      return srcCard.value === "ace";
  }
  let dstCard = dstStack[dstStack.length - 1];

  if (srcCard.suit !== dstCard.suit) {
      return false;
  }

  if (srcCard.value === "king" && dstCard.value === "queen") {
    return true;
  } else if (srcCard.value === "queen" && dstCard.value === "jack") {
    return true;
  } else if (srcCard.value === "jack" && dstCard.value === "10") {
    return true;
  } else if (srcCard.value === "2" && dstCard.value === "ace") {
    return true;
  } else if ((parseInt(srcCard.value, 10) - parseInt(dstCard.value, 10)) === 1) {
    return true;
  } else {
    return false;
  }
}

const onGameOver = async () => {
  const data = {
    active: false,
    winner: (checkWin()) ? props.user.username : undefined
  }
  let res = await updateGameState(data);
  if (checkWin()) {
    setState({
      ...state,
      active: false
    })
  }

  navigate(`/results/${id}`);
};

const onContinueGame = async () => {
  if (state.discard.length !== 0) {
    const data = {
      cards: state["discard"],
      src: 'discard',
      dst: 'draw',
      player: props.user.username
    };
    let res = await updateGameState(data);
  }
}

  return (
    <GameBase onClick={onEsc}>
      <FormButton id="autocomplete" disabled={state.gameOver} onClick={autoComplete}>
        Auto-Complete
      </FormButton>
      <div>*-*-*-*-*-*-*-♥-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-♦-*-*-*-*-*-*-*-*-*-*-*-*-*-*-♣-*-*-*-*-*-*-*-*-*-*-*-*-*-♠-*-*-*-*-*-*-*</div>
      <CardRow onClick={onEsc}>
        <Pile id='stack1' cards={state.stack1} spacing={0} onClick={onClick} />
        <Pile id='stack2' cards={state.stack2} spacing={0} onClick={onClick} />
        <Pile id='stack3' cards={state.stack3} spacing={0} onClick={onClick} />
        <Pile id='stack4' cards={state.stack4} spacing={0} onClick={onClick} />
        <CardRowGap onClick={onEsc}/>
        <Pile id='draw' cards={state.draw} spacing={0} onClick={onClick} />
        <Pile id='discard' cards={state.discard} spacing={0} onClick={onClick} />
      </CardRow>
      <CardRow onClick={onEsc}>
        <Pile id='pile1' cards={state.pile1} onClick={onClick} />
        <Pile id='pile2' cards={state.pile2} onClick={onClick} />
        <Pile id='pile3' cards={state.pile3} onClick={onClick} />
        <Pile id='pile4' cards={state.pile4} onClick={onClick} />
        <Pile id='pile5' cards={state.pile5} onClick={onClick} />
        <Pile id='pile6' cards={state.pile6} onClick={onClick} />
        <Pile id='pile7' cards={state.pile7} onClick={onClick} />
      </CardRow>
      {/* { checkWin() && state.active ? (
        <ModalNotify
            id="congrats"
            msg="Congratulations! You Win!!"
            onAccept={onGameOver}
        />
        ) : null }
      { checkGameOver(state) && !checkWin() && state.active ? (
        <ModalNotify
            id="gameOver"
            msg="Would you like to end the game?"
            onAccept={onGameOver}
            onCancel={onContinueGame}
        />
        ) : null } */}
    </GameBase>
  );
};

Game.propTypes = {};
