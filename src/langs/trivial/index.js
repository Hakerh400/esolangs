'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const {performance} = require('perf_hooks');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');
const format = require('../../common/format');
const parser = require('./parser');
const cs = require('./ctors');
const core = require('./core');

const {SHOW_SUBSTS} = cs;
const {SINGLE_CHAR_COMBINATORS} = core;

const DEBUG = 0;
const SPACE = 1;
const EAGER = 0;
const FILTER_IDENTS = 0;
const DEBUG_ON_REDUCE = 0;
const SHOW_PERF = 0;

const run = (src, input) => {
  const t = SHOW_PERF ? performance.now() : 0;

  const prog = parser.parseProg(String(src));
  const io = new O.IOBit(input);

  let ioFlag = 1;
  let end = 0;
  let ioSym = Symbol();

  const read = () => {
    ioSym = Symbol();

    return io.read();
  };

  const write = bit => {
    ioSym = Symbol();

    if(ioFlag){
      if(bit) ioFlag = 0;
      else end = 1;
    }else{
      io.write(bit);
      ioFlag = 1;
    }
  };

  const list = [prog.mainFunc.name];
  const popped = [];

  const top = () => {
    if(list.length === 0)
      return core.IO;

    return O.last(list);
  };

  const pop = () => {
    while(1){
      if(list.length === 0)
        return core.IO;

      const elem = list.pop();

      if(elem instanceof cs.Reduce){
        if(elem.ioSym !== ioSym) continue;

        const {ref} = elem;
        if(ref.reduced !== null) continue;

        const reduced = popped.slice();
        ref.reduced = reduced;

        if(DEBUG_ON_REDUCE){
          log('\n=== REDUCE ===\n');
          log(ref.toString());
          log.inc();
          log(reduced.join('\n'));
          log.dec();
          debug();
        }

        continue;
      }

      popped.push(elem);
      return elem;
    }
  };

  const push = elem => {
    list.push(elem);
  };

  const popArr = len => {
    const arr = [];

    for(let i = 0; i !== len; i++)
      arr.push(pop());

    return arr;
  };

  const pushArr = arr => {
    for(let i = arr.length - 1; i !== -1; i--)
      push(arr[i]);
  };

  const pushExpr = expr => {
    pushArr(expr.args);
    push(expr.target);
  };

  const subst = (expr, idents) => {
    if(EAGER){
      const subst = function*(expr){
        if(typeof expr === 'number')
          return expr;
      
        if(typeof expr === 'string'){
          if(O.has(idents, expr)) return idents[expr];
          return expr;
        }
      
        let found = 0;
      
        for(const ident in idents){
          if(O.has(expr.idents, ident)){
            found = 1;
            break;
          }
        }
      
        if(!found) return expr;
      
        const targetNew = yield [subst, expr.target];
        const argsNew = [];
      
        for(const arg of expr.args)
          argsNew.push(yield [subst, arg]);
      
        return new cs.Expression(targetNew, argsNew);
      };
      
      const exprNew = O.rec(subst, expr);
      pushExpr(exprNew);
      return;
    }

    const exprTarget = expr.target;
    const exprArgs = expr.args;

    for(let i = exprArgs.length - 1; i !== -1; i--){
      const exprArg = exprArgs[i];

      if(exprArg.arity === 0){
        const {target} = exprArg;
        push(target in idents ? idents[target] : target);
        continue;
      }

      if(FILTER_IDENTS){
        const identsNew = O.obj();
        const exprArgIdents = exprArg.idents;
        let found = 0;
        
        for(const ident in idents){
          if(ident in exprArgIdents){
            identsNew[ident] = idents[ident];
            found = 1;
          }
        }

        if(!found){
          push(exprArg);
          continue;
        }

        push(new cs.Substitution(exprArg, identsNew));
        continue;
      }

      push(new cs.Substitution(exprArg, idents));
    }

    push(exprTarget in idents ? idents[exprTarget] : exprTarget);
  };

  const coreFuncs = {
    [core.K](){
      const x = pop();
      const y = pop();
      push(x);
    },
    [core.S](){
      const x = pop();
      const y = pop();
      const z = pop();
      pushArr([x, z, new cs.Expression(y, [z])]);
    },
    [core.IO](){
      const arg = pop();
      pushArr([arg, core.WRITE, core.READ]);
    },
    [core.READ](){
      const arg = pop();
      const bit = read();

      if(DEBUG) log(`---> IN ${bit}`);

      pushArr([arg, bit ? core.BIT1 : core.BIT0]);
    },
    [core.WRITE](){
      const arg = pop();
      pushArr([arg, core.WRITE1, core.WRITE0]);
    },
    [core.WRITE0](){
      if(DEBUG) log(`---> OUT 0`);

      write(0);
    },
    [core.WRITE1](){
      if(DEBUG) log(`---> OUT 1`);

      write(1);
    },
    [core.BIT0](){
      pop();
    },
    [core.BIT1](){
      const arg = pop();
      pop();
      push(arg);
    },
  };

  let sPrev = null;
  let iterCnt = 0;

  while(!end){
    showDbgInfo: if(DEBUG){
      logList: {
        if(SINGLE_CHAR_COMBINATORS){
          let s = list.
            filter(a => !(a instanceof cs.Reduce)).
            reverse().
            map((elem, index) => {
              let s = String(core.getInfo(elem));
              if(index !== 0 && s.includes(' ')) s = `(${s})`;
              return s;
            }).join(' ');

          if(!SPACE)
            s = s.replace(/\s+/g, '');

          if(s === sPrev)
            break showDbgInfo;

          sPrev = s;

          O.logb();
          log(s);
          
          break logList;
        }

        O.logb();

        for(let i = list.length - 1; i !== -1; i--){
          const elem = list[i];
          if(elem instanceof cs.Reduce) continue;

          let s = String(core.getInfo(elem));

          if(!SPACE)
            s = s.replace(' ', '');

          log(s);
        }
      }

      // debug();
    }

    iterCnt++;

    popped.length = 0;

    const elem = pop(list);

    if(typeof elem === 'string'){
      const func = prog.getFunc(elem);
      const {args, expr} = func;

      if(args.length === 0){
        push(expr);
        continue;
      }

      const idents = O.obj();

      for(const argName of args)
        idents[argName] = pop();

      subst(expr, idents);
      continue;
    }

    if(typeof elem === 'number'){
      coreFuncs[elem]();
      continue;
    }

    const {reduced} = elem;

    if(reduced !== null){
      pushArr(reduced);
      continue;
    }

    push(new cs.Reduce(elem, ioSym));

    if(elem instanceof cs.Substitution){
      const {expr, idents} = elem;
      subst(expr, idents);
      continue;
    }

    if(elem instanceof cs.Expression){
      pushExpr(elem);
      continue;
    }

    log(elem);
    assert.fail();
  }

  if(DEBUG){
    O.logb();
    // while(1) debug();
  }

  if(SHOW_PERF){
    log(performance.now() - t);
    log(format.num(iterCnt));
    O.log();
  }

  return io.getOutput();
};

module.exports = run;