'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const rules = {
  script: e => new cs.Program(e.es[1].arr),
  func: e => new cs.Function(e.es[0].fst.name, e.es[2].jst, e.es[6].fst),
  args: e => e.es[2].arr,
  arg: e => {
    const x = e.fst.fst;
    if(x instanceof cs.Sum) return x;
    return new cs.Sum([x]);
  },
  expr: e => {
    const x = e.es[2].fst;
    const n = BigInt(e.fst.arr.length);
    if(n === 0n) return x;
    if(x instanceof cs.Integer) return new cs.Integer(x.val + n);
    return new cs.Sum([x, new cs.Integer(BigInt(n))]);
  },
  exprTerm: e => e.fst.fst,
  call: e => new cs.Call(e.es[0].fst.name, e.es[2].fst),
  ident: e => new cs.Ident(e.str),
  zero: e => new cs.Integer(0n),
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