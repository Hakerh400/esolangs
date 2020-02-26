'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const rules = {
  script: e => new cs.Program(e.es[1].arr),
  func: e => new cs.Function(e.es[0].fst, e.es[4].fst),
  args: e => e.es[2].arr,
  expr: e => new cs.Expression(e.es[0].fst, e.es[2].jst),
  elem: e => e.fst.fst,
  param: e => `&${e.es[2].fst}`,
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