'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const prog = e => cs.Program.fromAst(e.ast);

const rules = {
  script: e => e.es[1].fst.makeEntry(),
  expr: e => e.fst.fst,

  ident: e => {
    const p = prog(e);
    const name = e.str;

    if(/^[+\-]?(?:[0-9]+|0x[0-9a-f]+|0b[01]+|0o[0-7]+)$/i.test(name))
      return p.getInt(BigInt(name));

    return p.getSymbol(name);
  },

  object: e => {
    const p = prog(e);
    const proto = p.natives.protos.obj;

    switch(e.pti){
      case 0:
        return p.createObj(proto);
        break;

      case 1:
        return p.createObj(e.es[2].fst);
        break;

      case 2:
        return p.createObj(proto, e.es[2].fst);
        break;

      case 3:
        return p.createObj(e.es[2].fst, e.es[4].fst);
        break;

      default:
        assert.fail(e.pti);
        break;
    }
  },

  array: e => prog(e).createArr(e.es[2].arr),
  char: e => prog(e).getChar(e.fst.fst),
  string: e => prog(e).getStr(e.es[1].arr.join('')),
  proto: e => e.es[2].fst,
  kvPairs: e => e.fst.arr,
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