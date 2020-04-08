'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const rules = {
  script: e => new cs.Program(e.es[1].arr),
  inst: e => new cs.Instruction(O.last(e.fst.arr), e.es[2].fst, e.es[4].fst),
  label: e => e.fst.fst,
  var: e => e.str === 'x' ? 0 : 1,
  op: e => e.fst.fst,
  xor: e => cs.Operation.XOR,
  shl: e => cs.Operation.SHL,
  shr: e => cs.Operation.SHR,
  if: e => new cs.If(e.es[2].fst, e.es[4].fst),
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