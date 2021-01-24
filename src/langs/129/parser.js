'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const parse = src => {
  const str = `(${src})`.replace(/[^\(\)]/g, '');

  const parse = function*(str){
    if(str[0].length === 0) return null;
    if(str[0][0] !== '(') return null;

    str[0] = str[0].slice(1);

    const stack = new cs.Stack();

    while(1){
      if(str[0].length === 0) return null;

      if(str[0][0] === ')'){
        str[0] = str[0].slice(1);
        break;
      }

      const elem = yield [parse, str];
      if(elem === null) return null;

      stack.push(elem);
    }

    return stack.rev();
  };

  return O.rec(parse, [str]);
};

module.exports = {
  parse,
};