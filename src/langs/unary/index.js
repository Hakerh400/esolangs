'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

const run = (src, input) => {
  src = src.toString();

  let num = O.match(src, /0/g).length;
  if(num !== src.length) throw new SyntaxError('Only "0" characters are allowed');
  if(num === 0) throw new SyntaxError('Expected at least one 0');

  const bin = num.toString(2);
  if(bin.length % 3 !== 1) throw new SyntaxError('Invalid syntax');

  let str = '';
  while(num !== 1){
    str = '><+-.,[]'[num & 7] + str;
    num >>= 3;
  }

  return esolangs.run('brainfuck', str, input);
};

module.exports = run;