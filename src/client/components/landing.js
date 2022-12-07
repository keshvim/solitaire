/* Copyright G. Hemingway, @2022 - All rights reserved */
"use strict";

import React from "react";
import styled from "styled-components";

const LandingBase = styled.div`
  display: flex;
  justify-content: left;
  grid-area: main;
  // background-color: #eee;
  // background-image: linear-gradient(45deg, black 25%, transparent 25%, transparent 75%, black 75%, black), linear-gradient(-45deg, black 25%, transparent 25%, transparent 75%, black 75%, black);
  // background-size: 60px 60px;
  // height: ${window.innerWidth - 100}px;
  // height: 100%;
  width: 100%;
  overflow: auto;
  align-items: center;
`;

const LandingSb = styled.div`
display: flex;
justify-content: left;
grid-area: sb;
// background-color: #eee;
// background-image: linear-gradient(45deg, black 25%, transparent 25%, transparent 75%, black 75%, black), linear-gradient(-45deg, black 25%, transparent 25%, transparent 75%, black 75%, black);
// background-size: 60px 60px;
// height: 100%;
// width: 100%;
width: 100%;
overflow: auto;
// align-items: center;
`;

const LandingBackground = styled.div`
// display: inline-block;
background-color: #eee;
background-image: linear-gradient(45deg, black 25%, transparent 25%, transparent 75%, black 75%, black), linear-gradient(-45deg, black 25%, transparent 25%, transparent 75%, black 75%, black);
background-size: 60px 60px;
background-position: left;
border: none;
// background-repeat: repeat;
height: 624px;
width: 100%;
// margin-right: -40px;
margin-left: 0px;
overflow: hidden;
// transform: scaleY(-1);
display: flex;
   flex-direction: row;
   flex-wrap: wrap;
justify-content: center;
align-items: center;
`

const LandingBackground2 = styled.div`
// display: inline-block;
background-color: #eee;
background-image: linear-gradient(45deg, black 25%, transparent 25%, transparent 75%, black 75%, black), linear-gradient(-45deg, black 25%, transparent 25%, transparent 75%, black 75%, black);
background-size: 60px 60px;
background-position: left;
// border: black 2px solid;
// filter: drop-shadow(0 0 1px black);
// background-repeat: repeat;
height: 624px;
width: 100%;
// margin-right: -40px;
margin-left: 0px;
overflow: hidden;
transform: scaleX(-1);
`

const GameInfo = styled.div`
background: rgba(0,0,0,0.85);
color: #fff;
z-index: 10;
width: 400px;
height: 300px;
margin-left: -90px;
// margin-top: 10%;
display: flex;
justify-content: center;
align-content: center;
flex-direction: column;
text-align: center;
// font-style: bold;
border-radius: 25px;
`

export const Landing = () => (
  <>
  <LandingSb><LandingBackground2></LandingBackground2></LandingSb>
  <LandingBase><LandingBackground><GameInfo>
    <h2><b>Features to Test:</b></h2>
    <ul>
      <li>Edit Profile</li>
      <li>Fully working results page</li>
      <li>Auto-Complete Button</li>
      <li>Press Esc or click outside of a pile to deselect cards</li>
    </ul>
    </GameInfo></LandingBackground></LandingBase>
  </>
);
