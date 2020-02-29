'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');
const cs = require('./ctors');

const {Expression} = cs;

const defaultOpts = {
  debug: 0,
  showWarnings: 0,
};

const cex = (ident, args) => {
  return new Expression(ident, args);
};

class Engine{
  constructor(parsed, input, opts=O.obj()){
    this.parsed = parsed;
    this.input = input;
    this.output = null;
    this.opts = Object.assign(O.obj(), defaultOpts, opts);
  }

  run(){
    const {parsed: prog, input, opts} = this;
    const io = new O.IO(input, 0, 1);

    const {funcsObj} = prog;

    let evenBit = 1;
    let done = 0;

    const inputBit = () => {
      return io.read();
    };

    const outputBit = bit => {
      if(evenBit){
        if(!bit) done = 1;
        else evenBit = 0;
        return;
      }

      io.write(bit);
      evenBit = 1;
    };

    let inputExpr = cex('#input');
    let mainExpr = cex('main', [inputExpr]);
    let reduceInfo = null;

    const pop = expr => {
      if(reduceInfo !== null)
        reduceInfo[0][reduceInfo[1]] = expr;
      else
        mainExpr = expr;

      reduceInfo = null;
    };

    let s = null;

    mainLoop: while(1){
      if(opts.debug){
        const s1 = String(mainExpr);
        if(s1 !== s) debug(s1.substring(0, 190));
        s = s1;
      }

      const expr = reduceInfo !== null ? reduceInfo[2] : mainExpr;

      if(!expr.reduced){
        if(expr.ident === '#input'){
          expr.ident = inputBit() ? '1' : '0';
          expr.addArg(inputExpr = cex('#input'));
          continue;
        }

        if(expr.ident in funcsObj){
          const funcs = funcsObj[expr.ident];
          const argsNum = expr.args.length;

          findFunc: for(const func of funcs){
            const {expr1, expr2} = func;

            if(expr1.args.length !== argsNum)
              continue;

            const stack = O.ca(argsNum, i => [expr.args, i, expr1.args[i]]);
            const paramsObj = O.obj();

            let reduceCandidate = null;

            while(stack.length !== 0){
              const [args, index, e1] = stack.pop();
              const e2 = args[index];

              if(e1.isParam){
                paramsObj[e1.ident] = e2;
                continue;
              }

              if(!e2.reduced){
                if(reduceCandidate === null)
                  reduceCandidate = [args, index, e2];
                continue;
              }

              if(e1.ident !== e2.ident)
                continue findFunc;

              const args1 = e1.args;
              const args2 = e2.args;

              if(args1.length !== args2.length)
                continue findFunc;

              for(let i = 0; i !== args1.length; i++)
                stack.push([args2, i, args1[i]]);
            }

            if(reduceCandidate !== null){
              reduceInfo = reduceCandidate;
              continue mainLoop;
            }

            pop(expr2.substitute(paramsObj));
            continue mainLoop;
          }
        }

        expr.reduced = 1;
      }

      if(reduceInfo !== null){
        pop(expr);
        continue;
      }

      if((expr.ident === '0' || expr.ident === '1') && expr.args.length === 1){
        outputBit(expr.ident | 0);
        if(done) break;

        mainExpr = expr.args[0];
        continue;
      }

      if(opts.debug || opts.showWarnings)
        log(`WARNING: Abnormal termination:\n\n${expr}\n`);

      break;
    }

    this.output = io.getOutput();
  }
  
  getOutput(){
    return this.output;
  }
}

module.exports = Engine;