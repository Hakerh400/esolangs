'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');
const cs = require('./ctors');

const DEBUG = 0;

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
    const {funcsObj} = prog;

    if(!(MAIN_FUNC_NAME in funcsObj))
      esolangs.err(`Missing definition for function ${
        O.sf(MAIN_FUNC_NAME)}`);

    if(!(MAIN_FUNC_ARGS_NUM in funcsObj[MAIN_FUNC_NAME]))
      esolangs.err(`There must be a definition for function ${
        O.sf(MAIN_FUNC_NAME)} that takes ${
        O.gnum('argument', MAIN_FUNC_ARGS_NUM)}`);

    const stack = [[
      null,
      null,
      0n,
      new cs.Call(
        MAIN_FUNC_NAME, [
          new cs.Integer(buf2num(input)),
        ],
      ),
    ]];

    if(DEBUG)
      BigInt.prototype.toJSON = {a(){ return String(this); }}.a;

    let sPrev = null;

    while(1){
      if(DEBUG){
        const s = O.sf(stack);

        if(s !== sPrev){
          sPrev = s;
          log(O.sf(stack));
          debug(`\n${'='.repeat(100)}`);
        }
      }

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

    this.output = num2buf(stack[0][2]);
  }
  
  getOutput(){
    return this.output;
  }
}

const buf2num = buf => {
  let num = 0n;

  for(let i = buf.length - 1; i !== -1; i--)
    num = (num << 8n) | BigInt(buf[i]);

  return num;
};

const num2buf = num => {
  const arr = [];

  while(num !== 0n){
    arr.push(Number(num & 255n));
    num >>= 8n;
  }

  return Buffer.from(arr);
};

module.exports = Engine;