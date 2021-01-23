'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');
const cs = require('./ctors');

class Engine{
  constructor(parsed, input){
    this.parsed = parsed;
    this.input = String(input).split(' ').map(a => BigInt(a));
    this.output = null;
  }

  run(){
    const {parsed: prog, input} = this;
    const {funcsObj, mainFuncName} = prog;

    const mainFuncArgsNum = input.length;

    if(!(mainFuncArgsNum in funcsObj[mainFuncName]))
      esolangs.err(`Function ${
        O.sf(mainFuncName)} must take ${
        O.gnum('argument', mainFuncArgsNum)}, because the input has ${
        O.gnum('integer', mainFuncArgsNum)}`);

    const stack = [[
      null,
      null,
      0n,
      new cs.Call(
        mainFuncName,
        input.map(a => new cs.Integer(a)),
      ),
    ]];

    let sPrev = null;

    while(1){
      const sum = O.last(stack);

      if(sum.length === 3){
        if(stack.length === 1)
          break;

        stack.pop();
        sum[0][sum[1]] = new cs.Integer(sum[2]);
        continue;
      }

      const elem = O.last(sum);

      if(elem.isSum){
        sum.pop();

        for(const e of elem.elems)
          sum.push(e);
        
        continue;
      }

      if(elem.isCall){
        const {ident, args} = elem;

        if(!elem.reduced){
          elem.reduced = 1;

          args.forEach((arg, index) => {
            stack.push([args, index, 0n, arg]);
          });

          continue;
        }

        sum.pop();

        let obj = funcsObj[ident][args.length];

        for(const arg of args)
          obj = arg in obj ? obj[arg] : obj['*'];

        const {argNames, argOffsets, expr} = obj.func;
        const paramsObj = O.obj();

        for(const name in argNames)
          paramsObj[name] = new cs.Integer(args[argNames[name]].val - argOffsets[name]);

        sum.push(expr.subst(paramsObj));
        continue;
      }

      if(elem.isInt){
        sum.pop();
        sum[2] += elem.val;
        continue;
      }

      assert.fail();
    }

    this.output = Buffer.from(String(stack[0][2]));
  }
  
  getOutput(){
    return this.output;
  }
}

module.exports = Engine;