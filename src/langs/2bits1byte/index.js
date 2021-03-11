'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

const insts = O.enum([
  'DON',
  'ACT',
  'JMP',
  'END',
]);

const actMap = [3, 2, 0, 1];

const run = (src, input) => {
  if(src.length !== 1)
    esolangs.err(`Source code must be exactly one byte long`);

  const mem = O.ca(4, i => (src[0] >> (3 - i << 1)) & 3);
  let ip = 0;

  while(1){
    const inst = mem[ip++]; ip &= 3;

    if(inst === insts.DON)
      continue;

    if(inst === insts.ACT){
      const addr = mem[ip++]; ip &= 3;
      mem[addr] = actMap[mem[addr]];
      continue;
    }

    if(inst === insts.JMP){
      ip = mem[ip];
      continue;
    }

    if(inst === insts.END)
      break;

    assert.fail();
  }

  return Buffer.from([mem.reduce((a, b) => (a << 2) | b)]);
};

module.exports = run;