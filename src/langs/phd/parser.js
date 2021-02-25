'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

const simpleInsts = '0~*';

const parse = str => {
  str = str.replace(/[^0\~\*\(\)\[\]]+/g, '');

  let parens = 0;

  const err = msg => {
    esolangs.err(`${msg}\n\n${str}`);
  };

  const parseInsts = function*(){
    const insts = [];

    while(1){
      if(str.length === 0) break;
      if(/[\)\]]/.test(str[0])) break;

      insts.push(yield [parseInst]);
    }

    return insts;
  };

  const parseInst = function*(){
    assert(str.length !== 0);

    const c = str[0];

    if(parens && /[\*\(\)]/.test(c))
      err(`Character ${O.sf(c)} cannot appear inside () block`);

    str = str.slice(1);

    const index = simpleInsts.indexOf(c);
    if(index !== -1) return index;

    if(c === '['){
      const insts = yield [parseInsts];

      if(str[0] !== ']') err(`Expected "]"`);
      str = str.slice(1);

      return [0, insts];
    }

    if(c === '('){
      parens = 1;
      const insts = yield [parseInsts];
      parens = 0;

      if(str[0] !== ')') err(`Expected ")"`);
      str = str.slice(1);

      return [1, insts];
    }

    str = c + str;
    err(`Illegal character ${O.sf(c)}`);
  };

  const insts = O.rec(parseInsts);

  if(str.length !== 0)
    err(`Extra data found at the end of the source code`);

  return insts;
};

module.exports = {
  parse,
};