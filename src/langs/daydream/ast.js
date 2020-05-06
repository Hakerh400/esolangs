'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const rules = {
  script: e => new cs.Program(e.es[1].fst),
  bytecodeSection: e => new cs.Section(e.es[0].fst, e.es[2].fst),
  bytecodeOffset: e => e.es[2].fst,
  bytecodeInsts: e => e.fst.arr,
  bytecodeInst: e => e.fst.fst,
  bytecodeInt: e => e.fst.fst,
  bytecodeRept: e => new cs.Repeat(e.es[4].fst, e.es[0].fst),
  int: e => e.es[0].arr.length === 0 ? e.es[1].fst : -e.es[1].fst,
  intAbs: e => BigInt(e.str),
  intDec: e => e.fst.fst,
  intHex: e => e.fst.fst,
  whitespace: e => e.fst.fst,
  comment: e => e.fst.fst,
  inlineComment: e => e.fst.fst,
  multilineComment: e => e.fst.fst,
  s: e => e.fst.fst,
  s0: e => e.fst.fst,
  s1: e => e.fst.fst,
};

module.exports = rules;