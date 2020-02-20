'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const rules = {
  script: e => new cs.Program(e.fst.arr),
  def: e => new cs.Definition(e.es[0].fst, e.es[2].fst),
  op: e => e.fst.fst,
  construct: e => new cs.Construct(e.es[0].fst, e.es[2].fst, e.es[4].fst),
  extract: e => new cs.Extract(e.es[0].fst, e.es[2].fst),
  cond: e => new cs.Conditional(e.es[2].fst, e.es[4].fst),
  inv: e => new cs.Invocation(e.es[2].fst, e.es[4].fst),
  bit: e => e.str | 0,
  leftOrRight: e => e.str === '<' ? 0 : 1,
  ident: e => e.str,
  whitespace: e => e.fst.fst,
  comment: e => e.fst.fst,
  inlineComment: e => e.fst.fst,
  multilineComment: e => e.fst.fst,
  s: e => e.fst.fst,
  s0: e => e.fst.fst,
  s1: e => e.fst.fst,
};

module.exports = rules;