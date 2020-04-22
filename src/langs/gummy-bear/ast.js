'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const rules = {
  script: e => new cs.Program(e.es[1].arr),
  rule: e => new cs.Rule(e.es[0].fst, e.es[1].fst),
  lhs: e => new cs.Lhs(e.es[0].fst, e.es[2].fst),
  lhs1: e => [e.es[1].str, e.es[0].arr.length === 1],
  lhs2: e => [e.es[0].str, e.es[1].arr.length === 1],
  rhsOrEnd: e => e.pti === 0 ? e.es[1].fst : null,
  rhs: e => new cs.Rhs(...e.es[0].arr),
  bits: e => e.str,
  dotSep: e => e.fst.fst,
  whitespace: e => e.fst.fst,
  comment: e => e.fst.fst,
  inlineComment: e => e.fst.fst,
  multilineComment: e => e.fst.fst,
  s: e => e.fst.fst,
  s0: e => e.fst.fst,
  s1: e => e.fst.fst,
};

module.exports = rules;