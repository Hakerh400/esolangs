'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const rules = {
  script: e => new cs.Program(e.es[1].arr),
  elem: e => e.fst.fst,
  inst: e => new cs.Instruction(e.pti, e.es[2].arr),
  list: e => new cs.List(e.es[2].arr),
  num: e => {
    const {str} = e;
    const n = Number(str);

    if(n > Number.MAX_SAFE_INTEGER)
      esolangs.err(`Too large number ${str}`);

    return n;
  },
  numSep: e => e.fst.fst,
  whitespace: e => e.fst.fst,
  comment: e => e.fst.fst,
  inlineComment: e => e.fst.fst,
  multilineComment: e => e.fst.fst,
  s: e => e.fst.fst,
  s0: e => e.fst.fst,
  s1: e => e.fst.fst,
};

module.exports = rules;