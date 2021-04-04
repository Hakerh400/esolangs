'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const rules = {
  script: e => new cs.Program(e.es[1].arr),
  labelOrInst: e => e.fst.fst,
  label: e => new cs.Label(e.fst.fst),
  inst: e => e.fst.fst,
  copy: e => new cs.Copy(e.es[0].fst, e.es[2].fst),
  comp: e => new cs.Comp(e.es[0].fst, e.es[2].fst),
  jump: e => new cs.Jump(e.es[1].fst),
  addr: e => Array.from(e.str, a => a | 0),
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