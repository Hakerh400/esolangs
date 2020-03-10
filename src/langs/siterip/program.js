'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

class Program{
  isValid = 1;

  constructor(src){
    this.src = src;

    const insts = this.insts = [];
    const loops = [];

    for(const c of src){
      switch(c){
        case '<': insts.push(0); break;
        case '>': insts.push(1); break;
        case '-': insts.push(2); break;
        case '+': insts.push(3); break;
        case ',': insts.push(4); break;
        case '.': insts.push(5); break;

        case '[':
          loops.push(insts.length);
          insts.push(6, 0);
          break;

        case ']':
          if(loops.length === 0){
            this.isValid = 0;
            return;
          }
          
          const addr = loops.pop();
          insts.push(7, addr);
          insts[addr + 1] = insts.length;
          break;
      }
    }

    if(loops.length !== 0){
      this.isValid = 0;
      return;
    }

    this.len = insts.length;
    this.mem = O.obj();
    this.output = [];

    this.ip = 0;
    this.mptr = 0;
  }

  get isDone(){
    assert(this.isValid);
    return this.ip === this.len;
  }

  tick(){
    assert(this.isValid);
    assert(!this.isDone);

    switch(this.insts[this.ip++]){
      case 0: this.mptr = ~-this.mptr; break;
      case 1: this.mptr = -~this.mptr; break;
      case 2: this.mem[this.mptr] = ~-this.mem[this.mptr] & 255; break;
      case 3: this.mem[this.mptr] = -~this.mem[this.mptr] & 255; break;
      case 4: this.mem[this.mptr] = 0; break;

      case 6:
        if(this.mem[this.mptr]) this.ip++;
        else this.ip = this.insts[this.ip];
        break;

      case 7:
        this.ip = this.insts[this.ip];
        break;
    }
  }
};

module.exports = Program;