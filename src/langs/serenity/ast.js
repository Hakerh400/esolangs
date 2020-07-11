'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const rules = {
  script: e => e.es[1].fst.makeEntry(),
  elem: e => e.fst.fst,
  symbol: e => new cs.Symbol(e.ast, e.str),
  object: e => new cs.Object(e.ast, e.es[2].arr),
  array: e => new cs.Array(e.ast, e.es[2].arr),
  char: e => new cs.Char(e.ast, e.fst.fst),
  string: e => new cs.String(e.ast, e.es[1].arr.join('')),
  keyVal: e => [e.es[0].fst, e.es[4].fst],
  charChar: e => O.last(e.str),
  strChar: e => O.last(e.str),
  csep: e => e.fst.fst,
  ctrail: e => e.fst.fst,
  whitespace: e => e.fst.fst,
  comment: e => e.fst.fst,
  inlineComment: e => e.fst.fst,
  multilineComment: e => e.fst.fst,
  s: e => e.fst.fst,
  s0: e => e.fst.fst,
  s1: e => e.fst.fst,
};

module.exports = rules;