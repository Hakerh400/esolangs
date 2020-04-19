'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const rules = {
  script: e => new cs.Program(e.es[3].fst),
  mode: e => e.es[2].fst,
  modeSolve: e => new cs.ModeSolve(e.es[0].jst, e.es[2].arr),
  modeProve: e => new cs.ModeProve(e.es[0].arr, e.es[2].fst),
  equation: e => new cs.Equation(e.es[0].fst, e.es[4].fst),
  rule: e => new cs.InferenceRule(O.last(e.fst.arr), e.es[2].jst, e.es[4].fst, e.es[6].fst),
  label: e => e.fst.fst,
  vars: e => e.es[2].arr,
  var: e => new cs.VariableDefinition(e.es[0].fst, e.es[2].jst),
  constraints: e => e.es[4].arr,
  premises: e => e.fst.arr,
  expr: e => new cs.Expression(e.es[0].fst, e.es[1].jst),
  args: e => e.es[2].arr,
  ident: e => e.str,
  identAny: e => e.str,
  commaSep: e => e.fst.fst,
  whitespace: e => e.fst.fst,
  comment: e => e.fst.fst,
  inlineComment: e => e.fst.fst,
  multilineComment: e => e.fst.fst,
  s: e => e.fst.fst,
  s0: e => e.fst.fst,
  s1: e => e.fst.fst,
};

module.exports = rules;