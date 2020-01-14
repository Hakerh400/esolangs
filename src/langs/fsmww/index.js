'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

const run = (src, input) => {
  const inputArr = Array.from(Buffer.from(input));

  while(1){
    src = src.toString('latin1');

    if(src.length < 2)
      esolangs.err('Source code must be at least 2 characters long');

    const mode = src[0] === ':' ? 0 :
      src[0] === ';' ? 1 : null;

    if(mode === null)
      esolangs.err('The first character of the source code must be either ":" or ";"');

    if(!/[1-9]/.test(src[1]))
      esolangs.err('The second character of the source code must be a digit in range [1, 9]');

    const match = src.slice(1).match(/\d+/)[0];
    const memSize = BigInt(match);

    const insts = [];
    const loops = [];

    for(const c of src.slice(match.length + 1)){
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
          if(loops.length === 0)
            esolangs.err('Unmatched closed bracket');

          const addr = loops.pop();
          insts.push(7, addr);
          insts[addr + 1] = insts.length;
          break;
      }
    }

    if(loops.length !== 0)
      esolangs.err('Unmatched open bracket');

    const len = insts.length;
    const mem = O.obj();
    const output = [];

    let ip = 0;
    let mptr = 0n;

    while(ip !== len){
      switch(insts[ip++]){
        case 0:
          if(mptr-- === 0n)
            esolangs.err('Data pointer cannot be negative');
          break;

        case 1:
          if(++mptr === memSize)
            esolangs.err('Data pointer went outside of the memory (to the right)');
          break;

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

    const outBuf = Buffer.from(output);
    if(mode === 1) return outBuf;

    src = outBuf;
  }
};

module.exports = run;