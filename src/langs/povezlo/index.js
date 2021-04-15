'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');
const parser = require('./parser');
const cs = require('./ctors');
const Bit = require('./bit');

const DEBUG = 0;

Error.stackTraceLimit = O.N;

const run = (src, input) => {
  const prog = parser.parse(src);

  const inp = new Bit(function*(){
    return [0, Bit.fromArr(input, 1)];
  });

  let inCallDbg = 0;

  const call = function*(func, arg){
    if(DEBUG && !inCallDbg){
      log('CALL');
      log.inc();
      inCallDbg = 1;
      log(func.toString());
      log();
      log(arg.toString());
      inCallDbg = 0;
      log.dec();
      O.logb();
      debug();
    }

    assert(func instanceof cs.Function);
    assert(arg instanceof Bit);

    const argBit = yield [[arg, 'getBit']];
    const argNext = yield [[arg, 'getNext']];

    const expr = argBit === 0 ? func.case0 : func.case1;

    return expr2bit(expr, argNext);
  };

  const expr2bit = (expr, arg) => new Bit(function*(){
    if(expr instanceof cs.Argument){
      return [yield [[arg, 'getBit']], yield [[arg, 'getNext']]];
    }

    if(expr instanceof cs.Bit){
      return [expr.bit, expr2bit(expr.next, arg)];
    }

    if(expr instanceof cs.Call){
      const func = yield [cs.Function.parse, expr2bit(expr.target, arg)];
      // O.logb();
      // log('---> ' + expr.target)
      // log('---> ' + func)
      // O.exit()
      const funcArg = expr2bit(expr.arg, arg);
      const bits = yield [call, func, funcArg];
      return [yield [[bits, 'getBit']], yield [[bits, 'getNext']]];
    }

    assert.fail(expr);
  });

  const out = O.rec(call, prog, inp);

  return Buffer.from(O.rec([out, 'getOutput']));
};

module.exports = run;