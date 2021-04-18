'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');

const DEBUG = 0;
const DBG_SUFFIX = 0 ? '\t' : '';

const GeneratorFunction = function*(){}.constructor;

const run = (src, input) => {
  src = src.toString();

  const m = src.match(/[^\s\#\(\)\*\.01\<\>\[\]\|\@]/);
  if(m !== null) esolangs.err(`Invalid character ${m[0]}`);

  src = src.
    replace(/[\.\#\*\@\<\>]/g, a => ` ${
      ['arg', 'func', 'call', 'pair', 'fst', 'snd']['.#*@<>'.indexOf(a)]} `).
    replace(/(?<=[a-z]\b|[\)\]\|])(?!\s*(?:[\)\]\|]|$))/g, ',');

  // O.exit(src);

  while(/[\[\]]/.test(src)){
    const srcPrev = src;

    src = src.replace(/\[([^\[\]]*)\]/, (a, b) => {
      return `\`${b.replace(/(?=[\`\\])/g, `\\`)}\``;
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

const call = function*(arg='', src0='', src1=''){
  arg = arg.replace(/\ +$/g, '');

  const src = arg.startsWith('1') ? src1 : src0;

  arg = arg.slice(1);

  if(DEBUG){
    log(normStr(src));
    log();
    log('.'.repeat(20));
    log();
    yield [logArg, arg];
    O.logb();
  }

  let func;

  try{
    func = new GeneratorFunction(
      'arg, func, call, pair, fst, snd',
      `return(${src})`,
    );
  }catch(err){
    esolangs.err(`Invalid program`);
  }

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

const pair = function*(str1='', str2='', suffix=DBG_SUFFIX){
  if(!(str1 || str2)) return '';

  return (
    (str1[0] || ' ') +
    (str2[0] || ' ') +
    (yield [pair, str1.slice(1), str2.slice(1),'']) +
    (DEBUG ? suffix : '')
  );
};

const fst = function*(str=''){
  if(str === '') return '';
  // if(str.startsWith(' ')) return '';

  return (str[0] + (yield [fst, str.slice(2)]));
};

const snd = function*(str=''){
  return O.tco(fst, str.slice(1));
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

const logArg = function*(arg){
  if(DBG_SUFFIX && arg.endsWith(DBG_SUFFIX)){
    arg = arg.slice(0, -1);

    log('PAIR');
    log.inc();

    yield [logArg, yield [fst, arg]];
    yield [logArg, yield [snd, arg]];

    log.dec();
    return;
  }

  log(normStr(arg));
};

const normStr = str => {
  return O.sanl(str.trim()).map((line, index) => {
    line = line.trim();
    if(index === 0) return line;
    return `${' '.repeat(2)}${line}`;
  }).join('\n') || '(empty)';
};

module.exports = run;