'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

const run = (src, input) => {
  src = src.toString();

  const io = new O.IO(input);

  const insts = [];
  const loops = [];

  for(const c of src){
    switch(c){
      case '<': insts.push(0); break;
      case '>': insts.push(1); break;
      case '+': insts.push(3); break;
      case ',': insts.push(4); break;
      case ';': insts.push(5); break;

      case '[':
        loops.push(insts.length);
        insts.push(6, 0);
        break;

      case ']':
        if(loops.length === 0) throw new SyntaxError('Unmatched closed bracket');
        const addr = loops.pop();
        insts.push(7, addr);
        insts[addr + 1] = insts.length;
        break;
    }
  }

  if(loops.length !== 0) throw new SyntaxError('Unmatched open bracket');

  const len = insts.length;
  const mem = O.obj();

  let ip = 0;
  let mptr = 0;

  while(ip !== len){
    switch(insts[ip++]){
      case 0: mptr = ~-mptr; break;
      case 1: mptr = -~mptr; break;
      case 3: mem[mptr] ^= 1; break;
      case 4: mem[mptr] = io.read(); break;
      case 5: io.write(mem[mptr]); break;

      case 6:
        if(mem[mptr]) ip++;
        else ip = insts[ip];
        break;

      case 7:
        ip = insts[ip];
        break;
    }
  }

  return io.getOutput();
};

module.exports = run;