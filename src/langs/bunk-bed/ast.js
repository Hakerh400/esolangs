'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const rules = {
  script: e => new cs.Program(e.es[1].arr),
  inst: e => e.fst.fst,
  label: e => new cs.Label(e.fst.fst),
  assign: e => new cs.Assignment(e.es[0].fst, e.es[4].fst),
  get: e => new cs.Get(e.es[2].fst, e.es[4].fst),
  set: e => new cs.Set(e.es[2].fst, e.es[4].fst, e.es[6].fst),
  all: e => new cs.All(e.es[2].fst),
  cmp: e => new cs.Cmp(e.es[2].fst, e.es[4].fst),
  jmp: e => new cs.Jmp(e.es[2].fst),
  inp: e => new cs.Inp(),
  eof: e => new cs.Eof(),
  out: e => new cs.Out(e.es[2].fst),
  nop: e => new cs.Nop(),
  expr: e => e.fst.fst,
  var: e => new cs.Variable(e.fst.fst),
  ident: e => e.str,
  bit: e => e.str | 0,
  whitespace: e => e.fst.fst,
  comment: e => e.fst.fst,
  inlineComment: e => e.fst.fst,
  multilineComment: e => e.fst.fst,
  s: e => e.fst.fst,
  s0: e => e.fst.fst,
  s1: e => e.fst.fst,
};

module.exports = rules;