'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

const run = (src, input) => {
  src = src.toString();

  const insts = [];
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
        if(loops.length === 0) esolangs.err('Unmatched closed bracket');
        const addr = loops.pop();
        insts.push(7, addr);
        insts[addr + 1] = insts.length;
        break;
    }
  }

  if(loops.length !== 0) esolangs.err('Unmatched open bracket');

  const len = insts.length;
  const mem = O.obj();
  const inputArr = Array.from(Buffer.from(input));
  const output = [];

  let ip = 0;
  let mptr = 0;

  while(ip !== len){
    switch(insts[ip++]){
      case 0: mptr = ~-mptr; break;
      case 1: mptr = -~mptr; break;
      case 2: mem[mptr] = ~-mem[mptr] & 255; break;
      case 3: mem[mptr] = -~mem[mptr] & 255; break;
      case 4: mem[mptr] = inputArr.shift(); break;
      case 5: output.push(mem[mptr]); break;

      case 6:
        if(mem[mptr]) ip++;
        else ip = insts[ip];
        break;

      case 7:
        ip = insts[ip];
        break;
    }
  }

  return Buffer.from(output);
};

module.exports = run;