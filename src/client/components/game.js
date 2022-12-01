/* Copyright G. Hemingway, @2022 - All rights reserved */
"use strict";

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { Pile } from "./pile.js";

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

export const Game = () => {
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
  });
  let [target, setTarget] = useState({id: '', pile: '', cards: []});
  // let [startDrag, setStartDrag] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const getGameState = async () => {
      const response = await fetch(`/v1/game/${id}`);
      const data = await response.json();
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
      });

      window.addEventListener("keydown", function onPress(event) {
        if (event.key === "Escape") {
          onEsc(event);
        }
      }, false);
    };
    getGameState();
  }, [id, target]);

  const onClick = async (ev, pile) => {
    ev.stopPropagation();

    if (state[pile].length === 0) {
      if (pile === 'draw') {
        if (target.id === "" && target.pile === "" && target.cards.length === 0) {
          const data = {
            cards: state["discard"],
            src: 'discard',
            dst: 'draw'
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
          dst: pile
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
            dst: 'discard'
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
          dst: pile
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
        console.log("onEsc called");
    }
  }

  return (
    <GameBase onClick={onEsc}>
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
    </GameBase>
  );
};

Game.propTypes = {};
