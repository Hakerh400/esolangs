'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const rules = {
  script: e => e.es[1].fst,
  block: e => new cs.Block(e.fst.arr),
  inst: e => e.fst.fst,
  move: e => new cs.Move(
    e.es[0].str === '>' ? 1n : -1n,
    O.last(e.es[2].arr, 0n),
  ),
  moveDim: e => e.pti === 0 ? BigInt(e.str) : null,
  modify: e => new cs.Modify(e.str === '+' ? 1n : -1n),
  io: e => e.str === ',' ? new cs.Input() : new cs.Output(),
  loop: e => new cs.Loop(e.es[2].fst),
  whitespace: e => e.fst.fst,
  comment: e => e.fst.fst,
  inlineComment: e => e.fst.fst,
  multilineComment: e => e.fst.fst,
  s: e => e.fst.fst,
  s0: e => e.fst.fst,
  s1: e => e.fst.fst,
};

module.exports = rules;