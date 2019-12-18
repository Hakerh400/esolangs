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
  abstraction: e => new cs.Abstraction(e.es[2].fst.name, O.last(e.es[0].arr) === '&', e.es[6].fst),
  invocation: e => new cs.Invocation(e.es[0].fst, e.es[2].fst),
  grouping: e => e.es[2].fst,
  fancyFunc: e => new cs.FancyFunction(O.last(e.es[0].arr, []), e.es[4].arr),
  fancyArgs: e => e.es[2].arr,
  fancyArg: e => new cs.FancyArgument(e.es[2].fst.name, O.last(e.es[0].arr) === '&'),
  fancyCall: e => new cs.FancyCall(e.es[0].fst, O.last(e.es[4].arr, [])),
  fancyCallArgs: e => e.fst.arr,
  fancyExpr: e => e.fst.fst,
  varDecl: e => new cs.VarDeclaration(e.es[0].fst.name, e.es[4].fst),
  assignment: e => new cs.Assignment(e.es[0].fst.name, e.es[4].fst),
  commaSep: e => e.fst.fst,
  semicolonSep: e => e.fst.fst,
  whitespace: e => e.fst.fst,
  comment: e => e.fst.fst,
  inlineComment: e => e.fst.fst,
  multilineComment: e => e.fst.fst,
  s: e => e.fst.fst,
  s0: e => e.fst.fst,
  s1: e => e.fst.fst,
};

module.exports = rules;