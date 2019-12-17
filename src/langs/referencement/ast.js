'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const rules = {
  script: e => e.es[1].fst,
  expr: e => e.fst.fst,
  expr1: e => e.fst.fst,
  expr2: e => e.fst.fst,
  identifier: e => new cs.Identifier(e.str),
  abstraction: e => new cs.Abstraction(e.es[0].fst.name, O.last(e.es[2].arr) === ':', e.es[4].fst),
  invocation: e => new cs.Invocation(e.es[0].fst, e.es[2].fst),
  grouping: e => e.es[2].fst,
  whitespace: e => e.fst.fst,
  comment: e => e.fst.fst,
  inlineComment: e => e.fst.fst,
  multilineComment: e => e.fst.fst,
  s: e => e.fst.fst,
  s0: e => e.fst.fst,
  s1: e => e.fst.fst,
};

module.exports = rules;