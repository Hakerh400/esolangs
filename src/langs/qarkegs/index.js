'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const List = require('@hakerh400/list');
const esolangs = require('../..');
const debug = require('../../common/debug');

const {ListNode} = List;

const run = (src, input) => {
  const blocks = [];

  // Parse the source code
  {
    let dif = 0;

    const addDif = () => {
      if(dif === 0) return;

      O.last(blocks).push(4, dif);
      dif = 0;
    };

    blocks.push([0]);

    for(const char of src.toString()){
      if(/\s/.test(char)) continue;

      const block = O.last(blocks);

      if(char === '('){
        addDif();

        const blockNew = [0];
        block.push(blockNew);
        blocks.push(blockNew);

        continue;
      }

      if(char === ')'){
        if(blocks.length === 1)
          esolangs.err(`Missing open parenthese`);

        addDif();
        blocks.pop();

        continue;
      }

      if(char < '0' || char > '5')
        esolangs.err(`Illegal character ${O.sf(char)}`);

      if(char === '4'){
        dif++;
        continue;
      }

      addDif();
      block.push(char | 0);
    }

    if(blocks.length !== 1)
      esolangs.err(`Missing closed parenthese`);
  }

  // Prepare input
  const inp = Array.from(Buffer.from(input));
  let inpIndex = 0;

  if(inp.includes(0))
    esolangs.err(`Input cannot contain NULL bytes`);

  // Prepare output
  const outp = [];

  const read = () => {
    if(inpIndex === inp.length) return 0;
    return inp[inpIndex++];
  };

  const write = val => {
    outp.push(val);
  };

  // Initialize stack
  const stack = new Stack();

  const assertNotEmpty = () => {
    if(stack.isEmpty)
      esolangs.err(`Cannot access the top element, because the stack is empty`);
  };

  const push = val => {
    stack.push(val);
  };

  const pop = () => {
    assertNotEmpty();
    return stack.pop();
  };

  const top = () => {
    assertNotEmpty();
    return stack.last;
  };

  // Main loop
  while(1){
    const block = O.last(blocks);

    if(block[0] === block.length - 1){
      if(blocks.length === 1)
        break;

      if(top()){
        block[0] = 0;
        continue;
      }

      blocks.pop();
      O.last(blocks)[0]++;

      continue;
    }

    const inst = block[block[0] + 1];

    if(Array.isArray(inst)){
      if(top()){
        inst[0] = 0;
        blocks.push(inst);
        continue;
      }

      block[0]++;
      continue;
    }

    block[0]++;

    switch(inst){
      case 0: push(read()); break;
      case 1: write(pop()); break;
      case 2: pop(); break;
      case 3: push(top()); break;
      case 4: push(pop() + block[++block[0]] & 255); break;
      case 5: stack.reverse(); break;
      default: assert.fail(inst); break;
    }
  }

  return Buffer.from(outp);
};

class Stack extends List{
  dir = 0;

  get last(){
    if(this.dir === 0) return this.head.val;
    return this.tail.val;
  }

  push(val){
    const elem = new ListNode(this, val);
    if(this.dir === 0) super.unshift(elem);
    else super.push(elem);
  }

  pop(val){
    if(this.dir === 0) return super.shift().val;
    return super.pop().val;
  }

  reverse(){
    this.dir ^= 1;
  }
}

module.exports = run;