'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');

const run = (src, input) => {
  const code = src.toString();
  const mem = O.obj();
  const inp = Buffer.from(input);
  const outp = [];

  let ip = 0;
  let ptr = 0;
  let inpIndex = 0;

  const get = ptr => {
    if(ptr in mem) return mem[ptr];
    return 0;
  };

  const set = (ptr, val) => {
    mem[ptr] = val;
  };

  const read = () => {
    if(inpIndex === inp.length) return 0;
    return inp[inpIndex++];
  };

  const write = byte => {
    if(byte < 0 || byte > 255)
      esolangs.err(`Invalid output byte ${byte} (must be in range [0, 255])`);

    outp.push(byte);
  };

  while(ip >= 0 && ip < code.length){
    switch(code[ip]){
      case '+': set(ptr, get(ptr) + 1); ip++; break;
      case '-': set(ptr, get(ptr) - 1); ip++; break;
      case '<': ptr--; ip++; break;
      case '>': ptr++; ip++; break;
      case ',': set(ptr, read()); ip++; break;
      case '.': write(get(ptr)); ip++; break;
      case '^': set(ptr, get(ptr) + 2); ip++; break;
      case 'v': set(ptr, get(ptr) - 2); ip++; break;
      case '?': ip += get(ptr) ? 1 : 2; break;
      case '!': ip = get(ptr + 1); break;
      default: ip++; break;
    }
  }

  return Buffer.from(outp);
};

module.exports = run;