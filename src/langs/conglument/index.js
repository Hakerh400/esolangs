'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');
const parser = require('./parser');
const tk = require('./tokenizer');
const cs = require('./ctors');
const sf = require('./stack-frame');

const MINIFY = 1;

const run = (src, input) => {
  let frame = new sf.Global(parser.parse(src, input));
  let output = '';

  if(MINIFY){
    log(`${frame.func.target.minify()}\n`);
  }

  const set = func => {
    frame = frame.set(func);
  };

  const fail = () => {
    O.logb();

    log(frame.constructor.name);
    log();

    log(frame.func.toString());

    O.logb();

    assert.fail();
  };

  while(1){
    const {func} = frame;

    // log(func.toString());
    // debug(`\n${'='.repeat(100)}`);

    if(func instanceof cs.Empty){
      assert(frame instanceof sf.Global);
      assert(func.nullary);
      break;
    }

    if(func instanceof cs.String){
      const {str, arity} = func;

      if(str.length === 0){
        set(new cs.Empty(arity));
        continue;
      }

      const c = new cs.Composition(null);
      c.push(new cs.Prefix(str[0] | 0));
      c.push(new cs.String(str.slice(1), arity));
      set(c);

      continue;
    }

    if(func instanceof cs.Composition){
      const {target, args} = func;

      if(target instanceof cs.Empty){
        set(new cs.Empty(func.arity));
        continue;
      }

      if(target instanceof cs.Prefix){
        if(frame instanceof sf.Global){
          output += target.bit;
          // debug('---> ' + target.bit);
          set(args[0]);
          continue;
        }

        // frame = frame.prev;
        fail();

        continue;
      }

      if(target instanceof cs.Projection){
        set(args[target.index]);
        continue;
      }

      if(target instanceof cs.Composition){
        const {target: target1, args: args1} = target;
        const c = new cs.Composition(target1.nullary ? func.arity : null);
        const explicitArity = target.nullary ? func.arity : null

        c.push(target1);

        for(const arg1 of args1){
          const c1 = new cs.Composition(explicitArity);

          c1.push(arg1);

          for(const arg of args)
            c1.push(arg);

          c.push(c1);
        }

        assert(c.arity === func.arity);
        set(c);

        continue;
      }

      if(target instanceof cs.Recursion){
        const arg = args[0];

        if(arg instanceof cs.Empty){
          const f = target.empty;
          const c = new cs.Composition(f.nullary ? func.arity : null);

          c.push(f);

          args.forEach((arg, index) => {
            if(index === 0) return;
            c.push(arg);
          });

          set(c);

          continue;
        }

        if(arg instanceof cs.Prefix){
          assert.fail();
        }

        if(arg instanceof cs.Composition && arg.target instanceof cs.Prefix){
          const {bit} = arg.target;
          const f = bit ? target.one : target.zero;
          const y = arg.args[0];

          const c = new cs.Composition(f.nullary ? func.arity : null);
          c.push(f);
          c.push(y);

          const c1 = new cs.Composition(target.nullary ? y.arity : null);
          c1.push(target);
          c1.push(y);

          args.forEach((arg, index) => {
            if(index === 0) return;
            c1.push(arg);
          });

          c.push(c1);

          args.forEach((arg, index) => {
            if(index === 0) return;
            c.push(arg);
          });

          set(c);

          continue;
        }

        frame = new sf.CompositionArgument(frame, arg, 0);

        continue;
      }

      if(target instanceof cs.Minimization){
        const {strs} = target;

        if(strs.length === 0)
          esolangs.loop(`Minimization does not halt`);

        extractBit: {
          const bit = target.commonBit;
          if(bit === null) break extractBit;

          const c = new cs.Composition(null);
          const c1 = new cs.Composition(target.nullary ? 0 : null);

          c1.push(target.woutBit());

          for(const arg of args)
            c1.push(arg);

          c.push(new cs.Prefix(bit));
          c.push(c1);

          set(c);

          continue;
        }

        /*
          func            10 ~
          target            3 *
          target.func         4 (...)
          args[0]           10 A
          args[1]           10 B
          args[2]           10 C


          ========================================


          cMain           10 ~
          r                 11 -
          cAcc                10 (ACCEPT)
          cWrap               12 (WRAP)
          strs[0]             12 STR
          cFunc             10 ~
          target.func         4 (...)
          strs[0]             10 STR
          args[0]             10 A
          args[1]             10 B
          args[2]             10 C
          |                 10 % 10 0
          |                 10 % 10 1
          |                 10 % 10 2
          |                 ...
          |                 10 % 10 9


          cAcc              10 ~
          target.accept()     3 ACCEPT(...)
          args[0]             10 A
          args[1]             10 B
          args[2]             10 C


          cRej              10 ~
          target.reject()     3 REJECT(...)
          args[0]             10 A
          args[1]             10 B
          args[2]             10 C


          cWrap           12 ~
          cRej              10 cRej
          |                 12 % 12 0
          |                 12 % 12 1
          |                 12 % 12 2
          |                 ...
          |                 12 % 12 9
        */

        const str = strs[0];
        const argsNum = func.arity;

        log('---> ' + (str||'/'));

        const cAcc = new cs.Composition(target.nullary ? argsNum : null);
        cAcc.push(target.accept());

        const cRej = new cs.Composition(target.nullary ? argsNum : null);
        cRej.push(target.reject());

        const cFunc = new cs.Composition(null);
        cFunc.push(target.func);
        cFunc.push(new cs.String(str, argsNum));

        for(const arg of args){
          cAcc.push(arg);
          cRej.push(arg);
          cFunc.push(arg);
        }

        const cWrap = new cs.Composition(func.nullary ? argsNum + 2 : null);
        cWrap.push(cRej);

        for(let i = 0; i !== argsNum; i++)
          cWrap.push(new cs.Projection(argsNum + 2, i));

        const rec = new cs.Recursion();
        rec.push(cAcc);
        rec.push(cWrap);
        rec.push(new cs.String(str, argsNum + 2));

        const cMain = new cs.Composition(null);
        cMain.push(rec);
        cMain.push(cFunc);

        for(let i = 0; i !== argsNum; i++)
          cMain.push(new cs.Projection(argsNum, i));

        set(cMain);

        continue;
      }

      if(target instanceof cs.String){
        frame = new sf.CompositionTarget(frame, target);
        continue;
      }

      fail();
    }

    fail();
  }

  return Buffer.from(output);
};

module.exports = run;