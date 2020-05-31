'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const rules = {
  system: e => new cs.System(e.es[1].arr),
  funcDef: e => new cs.FunctionDefinition(e.es[0].fst, e.es[4].fst),
  expr: e => e.fst.fst,
  const: e => new cs.TemporaryStructure('const', e.str),
  pair: e => new cs.TemporaryStructure('pair', [e.es[2].fst, e.es[6].fst]),
  param: e => new cs.TemporaryStructure('ident', e.fst.fst),
  call: e => new cs.TemporaryStructure('call', [e.es[0].fst, e.es[2].fst]),
  target: e => e.es[1].fst,
  targetExpr: e => e.fst.fst,
  targetPair: e => new cs.TemporaryStructure('pair', [e.es[2].fst, e.es[6].fst]),
  targetCall: e => new cs.TemporaryStructure('call', [e.es[0].fst, e.es[2].fst]),
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