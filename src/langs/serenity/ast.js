'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const prog = e => cs.Program.fromAst(e.ast);

const rules = {
  script: e => e.es[1].fst.call().prog,
  expr: e => e.fst.fst,
  ident: e => prog(e).getIdent(e.str),
  object: e => prog(e).createObj(O.last(e.es[2].arr)),
  array: e => prog(e).createArr(e.es[2].arr),
  char: e => prog(e).getChar(e.fst.fst),
  string: e => prog(e).getStr(e.es[1].arr.join('')),
  objContent: e => e.fst.arr,
  keyVal: e => [e.es[0].fst, e.es[4].fst],
  charChar: e => O.last(e.str),
  strChar: e => O.last(e.str),
  csep: e => e.fst.fst,
  ctrail: e => e.fst.fst,
  whitespace: e => e.fst.fst,
  comment: e => e.fst.fst,
  inlineComment: e => e.fst.fst,
  multilineComment: e => e.fst.fst,
  s: e => e.fst.fst,
  s0: e => e.fst.fst,
  s1: e => e.fst.fst,
};

module.exports = rules;