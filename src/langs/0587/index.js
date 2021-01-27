'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const parser = require('./parser');
const cs = require('./ctors');

const DEBUG = 0;

const run = (src, input) => {
  const prog = parser.parse(String(src));

  input = String(input);
  let output = '';

  const nil = Symbol('nil');

  const ide = function*(lam, arg, v){
    return O.tco(reduce, lam, arg, v);
  };

  const nativeFuncs = {
    *2(lam, arg, v){
      if(DEBUG) log(`NATIVE 2`);

      if(arg === nil)
        esolangs.err(`Cannot get the argument: not in a lambda function`);

      return O.tco(reduce, lam, arg, arg);
    },

    *3(lam, arg, v){
      if(DEBUG) log(`NATIVE 3`);

      if(lam === nil)
        esolangs.err(`Cannot get the current function: not in a lambda function`);

      return O.tco(reduce, lam, arg, lam);
    },

    *4(lam, arg, v){
      if(DEBUG) log(`NATIVE 4`);

      let val = yield [reduce, lam, arg, v];

      while(typeof val === 'function')
        val = yield [val, lam, arg, null];

      if(typeof val === 'string'){
        output += val;
        return val;
      }

      if(typeof val === 'bigint'){
        output += String(val);
        return val;
      }

      if(val === null)
        esolangs.err(`Cannot print a null`);

      assert.fail(dbg(val));
    },

    *5(lam, arg, v){
      if(DEBUG) log(`NATIVE 5`);

      if(input.length === 0)
        return null;

      const c = input[0];
      input = input.slice(1);

      if(/\d/.test(c)) return BigInt(c);
      return c;
    },

    *6(lam, arg, v){
      if(DEBUG) log(`NATIVE 6`);

      const val = yield [reduce, lam, arg, v];

      if(typeof val !== 'bigint')
        esolangs.err(`Cannot increment a value that is not a number`);

      return val + 1n;
    },

    *7(lam, arg, v){
      if(DEBUG) log(`NATIVE 7`);

      const val = yield [reduce, lam, arg, v];

      if(typeof val !== 'bigint')
        esolangs.err(`Cannot decrement a value that is not a number`);

      return val - 1n;
    },

    *8(lam, arg, v){
      if(DEBUG) log(`NATIVE 8`);

      const val = yield [reduce, lam, arg, v];

      if(val === 0n)
        return ide;

      return val;
    },
  };

  const dbg = a => {
    if(a === nil) return 'nil';

    if(typeof a === 'function' && /^[2-8]$/.test(a.name))
      return `Nat[${a.name}]`;

    return String(a);
  };

  const reduce = function*(lam, arg, expr){
    if(DEBUG){
      log('----------');
      log('LAM:  ' + dbg(lam));
      log('ARG:  ' + dbg(arg));
      log('EXPR: ' + dbg(expr));
      log('----------');
    }

    if(expr instanceof cs.Application){
      const target = yield [reduce, lam, arg, expr.target];
      const v = yield [reduce, lam, arg, expr.arg];

      if(typeof target !== 'function'){
        if(target === null)
          esolangs.err(`Cannot call a null`);

        if(typeof target === 'string')
          esolangs.err(`Cannot call a string`);

        if(typeof target === 'bigint')
          esolangs.err(`Cannot call a number`);

        log(target.toString());
        O.logb();
        assert.fail();
      }

      return O.tco(target, lam, arg, v);
    }

    if(expr instanceof cs.Abstraction){
      const e = expr.expr;

      const lamNew = function*(lam, arg, v){
        if(DEBUG){
          log('----------');
          log('THIS: ' + dbg(`1${e}`));
          log('LAM:  ' + dbg(lam));
          log('ARG:  ' + dbg(arg));
          log('VAL:  ' + dbg(v));
          log('----------');
        }

        return O.tco(reduce, lamNew, v, e);
      };

      lamNew.e = e;

      if(DEBUG){
        lamNew.toString = () => `v -> ${e}`;
        log(`Result: [NEW] ${dbg(lamNew)}`);
      }

      return lamNew;
    }

    const createScope = func => {
      const scope = function*(lam1, arg1, v){
        if(DEBUG){
          log('----------');
          log('THIS: ' + dbg(func));
          log('LAM:  ' + dbg(lam));
          log('ARG:  ' + dbg(arg));
          log('VAL:  ' + dbg(v));
          log('----------');
        }

        return O.tco(func, lam, arg, v);
      };

      if(DEBUG){
        scope.toString = () => `{${
          dbg(lam)}, ${
          dbg(arg)}, ${
          dbg(func)}}`;

        log(`[SCOPE] ${dbg(scope)}`);
      }

      return scope;
    };

    if(expr instanceof cs.NativeFunction){
      if(DEBUG) log(`Result: ${expr.id}`);
      return createScope(nativeFuncs[expr.id]);
    }

    if(expr instanceof cs.Value){
      if(DEBUG) log(`VALUE: ${dbg(expr)}`);
      return expr.val;
    }

    if(typeof expr === 'function'){
      if(DEBUG) log(`Result: [OLD] ${dbg(expr)}`);
      return createScope(expr);
    }

    return expr;
  };

  const run = () => {
    O.rec(reduce, nil, nil, prog)
  };

  if(DEBUG){
    const a = O.debugRecursiveCalls;
    O.debugRecursiveCalls = 1;

    try{
      run();
    }finally{
      O.debugRecursiveCalls = a;
    }
  }else{
    run();
  }

  return Buffer.from(output);
};

module.exports = run;