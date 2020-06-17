'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');
const cs = require('./ctors');

const DEBUG = 1;

class Engine{
  constructor(parsed, input){
    this.prog = parsed;
    this.input = input;
    this.output = null;
  }

  run(){
    const {prog, input} = this;
    let inputIndex = 0;
    let output = '';

    const mainList = prog.elems;
    const stack = [];

    const debugState = () => {
      log([mainList.join(' '), ...stack.map(a => String(a))].map(a => {
        if(a.length > 190) a = a.slice(0, 187) + '...';
        return a;
      }).join('\n').trim());
      debug(`\n${'='.repeat(100)}`);
    };

    mainLoop: while(mainList.length !== 0){
      if(DEBUG) debugState();

      const elem = mainList.shift();
      const ctor = elem.constructor;
      const slen = stack.length;

      switch(ctor){
        case cs.Number: {
          const {val} = elem;

          if(slen === 0 && val <= 1n){
            output += val;
            break;
          }

          if(BigInt(slen) <= val) break;
          mainList.unshift(stack[Number(val)]);
        } break;

        case cs.Bind: {
          if(slen < 1) break;

          const group = stack[0];
          const {elems} = group;

          const index = elems.findIndex(a => a instanceof cs.Number);
          if(index === -1) break;

          if(elems[index].val === 0n){
            elems.splice(index, 1);
            break;
          }

          if(slen < 2) break;

          elems.splice(
            index, 1,
            stack.splice(1, 1)[0],
            new cs.Number(elems[index].val - 1n),
          );

          elems.push(new cs.Clean());
          mainList.unshift(elem);
        } break;

        case cs.Call: {
          if(slen < 1) break;

          const group = stack.shift();
          const {elems} = group;

          for(let i = elems.length - 1; i >= 0; i--)
            mainList.unshift(elems[i].copy());
        } break;

        case cs.BindAndCall: {
          mainList.unshift(new cs.Bind(), new cs.Call());
        } break;

        case cs.Clean: {
          if(slen < 2) break;
          stack.splice(1, 1);
        } break;

        case cs.Input: {
          mainList.unshift(new cs.Number(
            inputIndex !== input.length ?
              BigInt(input[inputIndex++]) : 2
          ));
        } break;

        case cs.Output: {
          if(mainList.length === 0) break;

          const num = mainList[0];
          if(!(num instanceof cs.Number)) break;
          if(num.val > 1n) break;

          mainList.shift();
          output += num.val;
        } break;

        case cs.Group: {
          stack.unshift(elem.copy());
        } break;

        default: {
          assert.fail(ctor.name);
        } break;
      }
    }

    if(DEBUG) debugState();

    this.output = Buffer.from(output);
  }
  
  getOutput(){
    return this.output;
  }
}

module.exports = Engine;