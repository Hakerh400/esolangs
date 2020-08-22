'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const rules = {
  script: e => new cs.Program(e.es[1].arr),
  line: e => new cs.Line(O.last(e.es[0].arr), e.es[2].fst),
  lhs: e => new cs.Lhs(e.es[2].str === ':' ? 0 : 1, O.last(e.es[0].arr)),
  rhs: e => new cs.Rhs(e.fst.fst),
  expr: e => e.fst.fst,
  expr1_: e => e.fst.fst,
  expr2_: e => e.fst.fst,
  expr3_: e => e.fst.fst,
  expr4_: e => e.fst.fst,
  expr5_: e => e.fst.fst,
  expr6_: e => e.fst.fst,
  expr7_: e => e.fst.fst,
  expr8_: e => e.fst.fst,
  expr1: e => e.fst.fst,
  expr2: e => e.fst.fst,
  expr3: e => e.fst.fst,
  expr4: e => e.fst.fst,
  expr5: e => e.fst.fst,
  expr6: e => e.fst.fst,
  expr7: e => e.fst.fst,
  expr8: e => e.fst.fst,
  neq: e => new cs.Operation('neq', e.es[0].fst, e.es[4].fst),
  equ: e => new cs.Operation('equ', e.es[0].fst, e.es[4].fst),
  sub: e => new cs.Operation('sub', e.es[0].fst, e.es[4].fst),
  add: e => new cs.Operation('add', e.es[0].fst, e.es[4].fst),
  div: e => new cs.Operation('div', e.es[0].fst, e.es[4].fst),
  mul: e => new cs.Operation('mul', e.es[0].fst, e.es[4].fst),
  exp: e => new cs.Operation('exp', e.es[0].fst, e.es[4].fst),
  group: e => e.es[2].fst,
  term: e => e.fst.fst,
  num: e => new cs.Number(+e.str),
  in: e => new cs.Input(),
  whitespace: e => e.fst.fst,
  lineBreak: e => e.fst.fst,
  lineBreakSep: e => e.fst.fst,
  comment: e => e.fst.fst,
  inlineComment: e => e.fst.fst,
  multilineComment: e => e.fst.fst,
  s: e => e.fst.fst,
  s0: e => e.fst.fst,
  s1: e => e.fst.fst,
};

module.exports = rules;