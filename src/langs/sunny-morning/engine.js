'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');
const cs = require('./ctors');

const types = O.enum([
  'BIT0',
  'BIT1',
  'LEFT',
  'RIGHT',
  'COND',
  'INV',
  'INPUT',
  'EOF',
]);

class Engine{
  constructor(parsed, input){
    this.parsed = parsed;
    this.input = input;
    this.output = null;
  }

  run(){
    const {parsed: prog, input} = this;
    const io = new O.IO(input, 0, 1);

    let inputExpr = [types.INPUT];
    const stack = [[types.INV, prog.mainDef, inputExpr]];

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

    const pop = expr => {
      if(stack.length === 1){
        stack[0] = expr;
        return;
      }

      stack.pop();
      O.last(stack)[1] = expr;
    };

    // const seen = new Set();
    
    // const f = (arr, tab='') => {
    //   if(seen.has(arr)) return `${tab}(...)`;
    //   seen.add(arr);

    //   const p = tab + ' '.repeat(2);
    //   const t = arr[0];

    //   if(t <= 1) return `${tab}${t}\n${f(arr[1], p)}\n${f(arr[2], p)}`;
    //   if(t <= 3) return `${tab}${t === 2 ? '<' : '>'}\n${f(arr[1], p)}`;
    //   if(t <= 4) return `${tab}${'?'}\n${f(arr[1], p)}\n${f(arr[2], p)}\n${f(arr[3], p)}`;
    //   if(t <= 5) return `${tab}${arr[1].name}\n${f(arr[2], p)}`;
    //   if(t <= 6) return `${tab}INPUT`;
    //   if(t <= 7) return `${tab}EOF`;
    // };

    // let sPrev = null;

    mainLoop: while(!done){
      // seen.clear();
      // let s = f(stack[0]);

      // if(s !== sPrev){
      //   sPrev = s;
      //   log('='.repeat(100) + '\n');
      //   debug(s);
      // }

      const expr = O.last(stack);

      if(expr[0] <= 1){
        outputBit(expr[0]);
        pop(expr[2]);
        continue;
      }

      switch(expr[0]){
        case types.LEFT:
          if(expr[1][0] > 1) stack.push(expr[1]);
          else pop(expr[1][1]);
          break;

        case types.RIGHT:
          if(expr[1][0] > 1) stack.push(expr[1]);
          else pop(expr[1][2]);
          break;

        case types.COND:
          if(expr[1][0] > 1) stack.push(expr[1]);
          else pop(expr[expr[1][0] + 2]);
          break;

        case types.INV:
          const def = expr[1];
          const {ops} = def;

          if(def.isCt) pop([def.bit, [types.INV, ops[0], expr[2]], [types.INV, ops[1], expr[2]]]);
          else if(def.isExt) pop([types.INV, ops[0], [def.type + 2, expr[2]]]);
          else if(def.isCond){
            if(def.type === 0) pop([types.COND, expr[2], [types.INV, ops[0], expr[2]], [types.INV, ops[1], expr[2]]]);
            else pop([types.COND, [types.INV, ops[0], expr[2]], [types.INV, ops[1], expr[2]], [types.INV, ops[2], expr[2]]]);
          }else if(def.isInv) pop([types.INV, ops[0], [types.INV, ops[1], expr[2]]]);
          break;

        case types.INPUT:
          inputExpr[0] = inputBit()
          inputExpr.push([types.EOF], inputExpr = [types.INPUT]);
          stack.pop();
          break;

        case types.EOF:
          pop([0, [types.EOF], [types.EOF]]);
          break;
      }
    }

    this.output = io.getOutput();
  }
  
  getOutput(){
    return this.output;
  }
}

module.exports = Engine;