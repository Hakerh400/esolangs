'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');
const parser = require('./parser');

const run = (src, input) => {
  const insts = parser.parse(src);
  const instsNum = insts.length;
  const stacks = [[], []];

  const inp = Array.from(input, a => a & 1).reverse();
  const out = [];

  let ip = 0;
  let running = 1;

  const push = bit => {
    const stack = stacks[0];

    if(stack.length === 0 && bit === 0)
      return;

    stack.push(bit);
  };

  const pop = () => {
    const stack = stacks[0];
    
    if(stack.length === 0)
      return 0;

    return stack.pop();
  };

  const top = () => {
    const stack = stacks[0];
    return O.last(stack, 0);
  };

  const test = bit => {
    if(bit) return;

    if(ip === instsNum){
      running = 0;
      return;
    }

    ip++;
  };

  const read = () => {
    if(eof()) return 0;
    return inp.pop();
  };

  const write = bit => {
    out.push(bit);
  };

  const neof = () => {
    return inp.length !== 0;
  };

  const eof = () => {
    return !neof();
  };

  while(running && ip !== instsNum){
    assert(ip < instsNum);
    const inst = insts[ip++];

    if(Array.isArray(inst)){
      assert(inst.length === 1);
      ip = inst[0];
      continue;
    }

    if(inst <= 1){
      push(inst);
      continue;
    }

    if(inst === 2){
      push(pop() ^ 1);
      continue;
    }

    if(inst === 3){
      const bit = pop();
      push(bit);
      push(bit);
      continue;
    }

    if(inst === 4){
      stacks.reverse();
      continue;
    }

    if(inst === 5){
      pop();
      continue;
    }

    if(inst === 6){
      test(top());
      continue;
    }

    if(inst === 8){
      test(neof());
      continue;
    }

    if(inst === 9){
      push(read());
      continue;
    }

    if(inst === 10){
      write(pop());
      continue;
    }

    assert.fail(inst);
  }

  return Buffer.from(out.join(''));
};

module.exports = run;