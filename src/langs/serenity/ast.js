'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const prog = e => cs.Program.fromAst(e.ast);

const rules = {
  script: e => e.es[1].fst.makeEntry(),
  expr: e => e.fst.fst,
  ident: e => {
    const name = e.str;

    const err = () => esolangs.err(`Invalid identifier ${O.sf(name)}`);
    const chk = a => a || err();

    if(name.includes('*'))
      chk(name === 'prod*');

    return prog(e).getIdent(name);
  },
  object: e => prog(e).createObj(e.es[2].arr),
  array: e => prog(e).createArrLab(e.es[2].arr),
  char: e => prog(e).getChar(O.cc(e.es[1].fst)),
  string: e => prog(e).getStr(Buffer.from(e.es[1].arr.join(''))),
  keyVal: e => [e.es[0].fst, e.es[4].fst],
  exprOrLab: e => e.fst.fst,
  lab: e => new cs.Label(e.str.replace(':', ''), e.pti === 0 ? 1 : 0),
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