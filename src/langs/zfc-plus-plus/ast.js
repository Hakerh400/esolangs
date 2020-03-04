'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const rules = {
  script: e => new cs.Program(e.es[1].arr),
  funcDef: e => new cs.FunctionDefinition(e.es[0].fst.name, e.es[2].jst.map(a => a.name), e.es[6].fst),
  formalArgs: e => e.es[2].arr,
  expr: e => e.fst.fst,
  invert: e => new cs.Invert(e.es[2].fst),
  set: e => new cs.Set(e.es[2].arr),
  call: e => new cs.Call(e.es[0].fst.name, e.es[4].arr),
  arg: e => new cs.Argument(e.es[2].fst, e.es[0].arr.length),
  ident: e => new cs.Identifier(e.str),
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