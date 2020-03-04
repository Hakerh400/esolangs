'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const {SET_EMPTY, SET_SINGLETON} = cs.Set;

const DEBUG = 1;

const MAIN_FUNC_NAME = 'main';
const MAIN_FUNC_ARGS_NUM = 1;

class Engine{
  constructor(parsed, input){
    this.parsed = parsed;
    this.input = input;
    this.output = null;
  }

  run(){
    const {parsed: prog, input} = this;
    const io = new O.IO(input, 0, 1);

    const {funcsObj} = prog;

    if(!(MAIN_FUNC_NAME in funcsObj))
      esolangs.err(`Missing definition for function ${
        O.sf(MAIN_FUNC_NAME)}`);

    if(!(MAIN_FUNC_ARGS_NUM in funcsObj[MAIN_FUNC_NAME]))
      esolangs.err(`There must be a definition for function ${
        O.sf(MAIN_FUNC_NAME)} that takes ${
        O.gnum('argument', MAIN_FUNC_ARGS_NUM)}`);

    const mainSet = new cs.Set();

    const mainCall = new cs.Call('main', [
      new cs.Argument(
        new cs.Set([new cs.Set()]),
      ),
    ]);
    
    mainCall.funcRef = funcsObj[MAIN_FUNC_NAME][MAIN_FUNC_ARGS_NUM];
    mainSet.elems.push(mainCall);

    const stack = [mainSet];

    const push = expr => {
      assert(expr !== null);

      stack.push(expr);
    };

    const pop = (expr=O.last(stack)) => {
      stack.pop();

      const last = O.last(stack);
      assert(last.reducing);

      if(last.isVector){
        assert(last.reducedNum < last.len);

        last.reducing = 0;
        last.arr[last.reducedNum++] = expr;

        return;
      }

      if(last.isUnary){
        assert(last.reducedNum === 0);

        last.reducing = 0;
        last.expr = expr;
        last.reducedNum = 1;

        return;
      }

      assert.fail();
    };

    const replace = expr => {
      const last = stack[stack.length - 2];

      if(last.isVector){
        last.arr[last.reducedNum] = expr;
      }else{
        last.expr = expr;
      }

      O.setLast(stack, expr);
    };

    let sPrev = null;

    while(1){
      if(DEBUG){
        const s = mainSet.elems[0].toString();

        if(s !== sPrev){
          sPrev = s;
          log(s);
        }

        // log(`${stack.map(expr => {
        //   let s = null;

        //   try{
        //     s = expr.toString();
        //   }catch{}

        //   if(s === null){
        //     log(`\n${'='.repeat(100)}\n`);
        //     O.logf(expr);
        //     O.exit();
        //   }

        //   return s;
        // }).join('\n')}\n`);
      }

      const expr = O.last(stack);
      assert(!expr.reducing);

      if(expr.isVector){
        if(!expr.reduced){
          assert(!expr.reducing);

          expr.reducing = 1;
          push(expr.arr[expr.reducedNum]);

          continue;
        }

        if(expr.isCall){
          replace(expr.perform());
          continue;
        }

        if(stack.length === 1) break;

        if(!expr.sorted)
          expr.sort();

        pop(expr);

        continue;
      }

      if(expr.isUnary){
        if(!expr.reduced){
          expr.reducing = 1;
          push(expr.expr);
          continue;
        }

        if(expr.isArg){
          pop();
          continue;
        }

        if(expr.isInvert){
          pop(expr.expr.isNonEmpty ? SET_EMPTY : SET_SINGLETON);
          continue;
        }

        if(expr.isUnion){
          const elems = [];

          for(const elem of expr.expr.elems)
            for(const e of elem.elems)
              elems.push(e);

          pop(cs.Set.reducedFromElems(elems));

          continue;
        }

        assert.fail();
        continue;
      }

      assert.fail();
    }

    // log('---> ' + mainSet.arr[0]);

    this.output = io.getOutput();
  }
  
  getOutput(){
    return this.output;
  }
}

module.exports = Engine;