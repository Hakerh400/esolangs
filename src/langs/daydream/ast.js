'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const rules = {
  script: e => new cs.Program(e.es[1].fst),
  sections: e => [...e.es[0].arr, ...e.es[1].arr],
  firstSection: e => new cs.Section(O.last(e.es[0].arr, 0n), e.es[2].fst),
  section: e => new cs.Section(e.es[0].fst, e.es[2].fst),
  start: e => e.fst.fst,
  insts: e => e.fst.arr,
  inst: e => e.fst.fst,
  rept: e => new cs.Repeat(e.es[4].fst, e.es[0].fst),
  num: e => e.es[0].arr.length === 0 ? e.es[1].fst : -e.es[1].fst,
  numAbs: e => BigInt(e.str),
  numDec: e => e.fst.fst,
  numHex: e => e.fst.fst,
  whitespace: e => e.fst.fst,
  comment: e => e.fst.fst,
  inlineComment: e => e.fst.fst,
  multilineComment: e => e.fst.fst,
  s: e => e.fst.fst,
  s0: e => e.fst.fst,
  s1: e => e.fst.fst,
};

module.exports = rules;