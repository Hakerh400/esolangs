'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');
const Memory = require('./memory');

class Engine{
  constructor(parsed, input){
    this.parsed = parsed;
    this.input = input;
    this.output = null;
  }

  run(){
    const {parsed, input} = this;
    const output = [];

    const mem = new Memory();
    const ptr = [];

    let block = parsed;
    let inputIndex = 0;

    while(block !== null){
      const {insts, index} = block;

      if(index === insts.length){
        block = block.parent;
        continue;
      }

      const inst = insts[index];

      if(inst instanceof cs.Loop){
        if((mem.get(ptr) & 255n) !== 0n){
          block = inst.block;
          block.index = 0;
          continue;
        }

        block.index++;
        continue;
      }

      block.index++;

      if(inst instanceof cs.Move){
        const dim = inst.dim !== null ? inst.dim : mem.get(ptr);
        const pos = dim >= 0n;
        const abs = pos ? dim : ~dim;
        const dif = pos ? inst.dir : -inst.dir;

        while(BigInt(ptr.length) <= abs)
          ptr.push(0n);

        ptr[abs] += dif;
        log(ptr.join(' '));
        continue;
      }

      if(inst instanceof cs.Modify){
        if(inst.dif === 1n) mem.inc(ptr);
        else mem.dec(ptr);
        continue;
      }

      if(inst instanceof cs.Input){
        const byte = BigInt(inputIndex !== input.length ? input[inputIndex++] : 0);
        mem.set(ptr, byte);
        continue;
      }

      if(inst instanceof cs.Output){
        output.push(Number(mem.get(ptr) & 255n));
        continue;
      }

      O.noimpl(inst.constructor.name);
    }

    this.output = Buffer.from(output);
  }
  
  getOutput(){
    return this.output;
  }
}

module.exports = Engine;