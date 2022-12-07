/* Copyright G. Hemingway, @2022 - All rights reserved */
"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const CardState = require("./card_state.cjs");

/***************** Move Model *******************/

/* Schema for an individual move of Klondike */
let Move = new Schema({
    user: { type: Schema.ObjectId, ref: "User", required: true, index: true },
    cards: { type: [CardState] },
    src: { type: String },
    dst: { type: String },
    date: { type: Date }
  });

Move.pre("validate", function(next) {
  this.date = Date.now();
  next();
});

module.exports = mongoose.model("Move", Move);
