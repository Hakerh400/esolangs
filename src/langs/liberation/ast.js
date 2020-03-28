'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const rules = {
  script: e => new cs.Program(e.es[1].arr),
  rule: e => new cs.Rule(e.es[0].fst, e.es[4].fst),
  lhs: e => new cs.Lhs(e.es[1].arr.slice().reverse(), e.es[3].arr, e.es[0].arr.length !== 0, e.es[4].arr.length !== 0),
  rhs: e => new cs.Rhs(e.pti === 0 ? [] : e.fst.arr),
  lhsElem: e => e.str | 0,
  rhsElem: e => e.str === '.' ? 2 : e.str | 0,
  whitespace: e => e.fst.fst,
  comment: e => e.fst.fst,
  inlineComment: e => e.fst.fst,
  multilineComment: e => e.fst.fst,
  s: e => e.fst.fst,
  s0: e => e.fst.fst,
  s1: e => e.fst.fst,
};

module.exports = rules;