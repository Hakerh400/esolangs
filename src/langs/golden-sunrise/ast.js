'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const rules = {
  script: e => new cs.Script(e.fst.arr),
  rule: e => new cs.Rule(e.es[0].fst, e.es[4].fst),
  lhs: e => {
    if(e.pti === 0) return new cs.Lhs(e.es[0].arr, e.es[1].arr.length === 0);
    return new cs.Lhs([], 1);
  },
  rhs: e => new cs.Rhs(e.pti === 0 ? e.es[0].arr : []),
  lhsTerm: e => e.fst.fst,
  rhsTerm: e => e.fst.fst,
  match: e => new cs.Match(),
  group: e => new cs.Group(e.es[3].arr),
  invertedIdent: e => new cs.Identifier(e.es[1].fst.name, 1),
  ident: e => new cs.Identifier(e.str),
  singleCharIdent: e => e.fst.fst,
  multiCharIdent: e => e.fst.fst,
  unrestrictedIdentChar: e => e.fst.fst,
  restrictedIdentChar: e => e.fst.fst,
  bit: e => new cs.Bit(e.str | 0),
  whitespace: e => e.fst.fst,
  comment: e => e.fst.fst,
  inlineComment: e => e.fst.fst,
  multilineComment: e => e.fst.fst,
  s: e => e.fst.fst,
  s0: e => e.fst.fst,
  s1: e => e.fst.fst,
};

module.exports = rules;