'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const parse = str => {
  const parse = function*(){
    str = str.trimLeft();

    if(str.length === 0)
      esolangs.err(`Unexpected end of the source code`);

    const c = str[0];
    str = str.slice(1);

    if(c === '0'){
      const target = yield [parse];
      const arg = yield [parse];
      return new cs.Application(target, arg);
    }

    if(c === '1'){
      const expr = yield [parse];
      return new cs.Abstraction(expr);
    }

    if(c === '9')
      return new cs.Null();

    if(/[2-8]/.test(c))
      return new cs.NativeFunction(+c);

    if(c === '('){
      let s = '';
      let depth = 0;

      while(1){
        if(str.length === 0)
          esolangs.err(`Missing closed parenthese`);

        const c = str[0];
        str = str.slice(1);

        if(c === '('){
          depth++;
          s += c;
          continue;
        }

        if(c === ')'){
          if(depth === 0) break;
          depth--;
          s += c;
          continue;
        }

        s += c;
      }

      return cs.Value.from(s);
    }

    esolangs.err(`Invalid character ${O.sf(c)}`);
  };

  const prog = O.rec(parse);

  str = str.trimLeft();

  if(str.length !== 0)
    esolangs.err(`Extra data found at the end of the source code:\n\n${O.sf(str)}`);

  if(!(prog instanceof cs.Application))
    esolangs.err(`The program must be a functional application`);

  return prog;
};

module.exports = {
  parse,
};