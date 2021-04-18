'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');

const DEBUG = 0;

const GeneratorFunction = function*(){}.constructor;

const run = (src, input) => {
  src = src.toString();

  const m = src.match(/[^\s\#\(\)\*\.01\<\>\@\[\]\|]/);
  if(m !== null) esolangs.err(`Invalid character ${m[0]}`);

  src = src.
    replace(/[\.\#\*\@\<\>]/g, a => ` ${
      ['arg', 'func', 'call', 'pair', 'fst', 'snd']['.#*@<>'.indexOf(a)]} `).
    replace(/(?<=[a-z]\b|[\)\]\|])(?!\s*(?:[\)\]\|]|$))/g, ',');

  // O.exit(src);

  while(/[\[\]]/.test(src)){
    const srcPrev = src;

    src = src.replace(/\[([^\[\]]*)\]/, (a, b) => {
      return `\`${b.replace(/\`/g, `\\\``)}\``;
    });

    if(src === srcPrev)
      esolangs.err('Unbalanced parentheses');
  }

  src = src.
    replace(/(?=call|pair|fst|snd)/g, '[').
    replace(/\[/g, 'yield[').
    replace(/\|/g, ']').
    replace(/[01]+/g, a => `'${a}'+`);

  // O.exit(src);

  const result = O.rec(call, initInput(input.toString()), src);
  const output = parseOutput(result);

  return Buffer.from(output);
};

const call = function*(arg, src0=null, src1=null){
  arg = arg.replace(/\@+$/g, '');

  const src = arg.startsWith('1') ? src1 : src0;
  assert(src !== null);

  arg = arg.slice(1);

  if(DEBUG){
    log(src);
    log();
    log('.'.repeat(20));
    log();
    log(arg);
    O.logb();
  }

  const func = new GeneratorFunction(
    'arg, func, call, pair, fst, snd',
    `return(${src})`,
  );

  const result = yield [func, arg, src, call, pair, fst, snd];

  if(typeof result !== 'string'){
    const type = typeof result;

    if(DEBUG){
      O.logb();
      log(type);
      log();
      log(result);
      O.logb();
      assert.fail();
    }

    esolangs.err(`The result has type ${O.sf(type)}`);
  }

  return result;
};

const pair = function*(str1, str2){
  return `${str1.length}.${str1}${str2}`;
};

const fst = function*(str){
  const match = str.match(/^[0-9]*/)[0];
  const len = Math.min(+match, str.length);
  const start = match.length + 1;

  return str.slice(start, start + len);
};

const snd = function*(str){
  const match = str.match(/^[0-9]*/)[0];
  const len = Math.min(+match, str.length);
  const start = match.length + len + 1;
  
  return str.slice(start);
};

const initInput = str => {
  return `0${str.replace(/./g, a => `1${a}`)}`;
};

const parseOutput = str => {
  let s = '';

  while(str.startsWith('1')){
    s += str[1] === '1' ? '1' : '0';
    str = str.slice(2);
  }

  return s;
};

module.exports = run;