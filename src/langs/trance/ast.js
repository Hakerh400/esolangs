'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const rules = {
  script: e => new cs.Program(e.es[1].arr),
  func: e => new cs.Function(e.es[0].fst.name, e.es[2].jst, e.es[6].fst),
  args: e => e.es[2].arr,
  arg: e => e.fst.fst,
  expr: e => e.fst.fst,
  sum: e => new cs.Sum(e.es[0].arr),
  exprTerm: e => e.fst.fst,
  call: e => new cs.Call(e.es[0].fst.name, e.es[2].fst),
  ident: e => new cs.Ident(e.str),
  literal: e => e.fst.fst,
  integer: e => new cs.Integer(BigInt(e.str)),
  commaSep: e => e.fst.fst,
  plusSep: e => e.fst.fst,
  whitespace: e => e.fst.fst,
  comment: e => e.fst.fst,
  inlineComment: e => e.fst.fst,
  multilineComment: e => e.fst.fst,
  s: e => e.fst.fst,
  s0: e => e.fst.fst,
  s1: e => e.fst.fst,
};

module.exports = rules;