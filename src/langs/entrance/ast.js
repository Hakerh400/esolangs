'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const rules = {
  script: e => new cs.System(e.es[1].arr),
  rule: e => new cs.Rule(e.es[0].jst, e.es[2].jst, e.es[4].fst),
  vars: e => e.es[2].arr,
  var: e => new cs.VariableDefinition(e.es[0].fst, e.es[2].jst),
  constraints: e => e.es[4].arr,
  premises: e => e.fst.arr,
  expr: e => new cs.Expression(e.es[0].fst, e.es[1].jst),
  args: e => e.es[2].arr,
  ident: e => e.str,
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