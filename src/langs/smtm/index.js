'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');

const DEBUG = 1;

const run = (src, input) => {
  src = src.toString().replace(/\/\/(?:[^\r\n]*)/g, '');
  input = input.toString().replace(/\s+/g, '');

  if(/[^01]/.test(input))
    esolangs.err(`Input string may contain only characters '0' and '1'`);

  const mem = O.obj();

  // Initialize memory
  {
    let i = 0n;

    for(const match of O.exec(src, /[01]/g))
      mem[i++] = match[0] | 0;

    for(const bit of input){
      mem[i++] = 1;
      mem[i++] = bit | 0;
    }
  }

  let parity = 0n;

  const read = addr => {
    return mem[(addr << 1n) | parity] ? 1n : 0n;
  };

  const write = (addr, bit) => {
    mem[(addr << 1n) | parity] = bit ? 1 : 0;
  };

  const readSize = addr => {
    let size = 0n;
    while(read(addr + size++));
    return size;
  };

  const readInt = (addr, size) => {
    let n = 0n;

    for(let i = addr, j = i + size; i !== j; i++)
      n = (n << 1n) | read(i);

    return n;
  };

  const writeInt = (addr, size, n) => {
    for(let i = addr + size; i >= addr; i--){
      write(i, n & 1n);
      n >>= 1n;
    }
  };

  // Main loop
  while(1){
    parity = mem[1] ? 1n : 0n;

    const csize = readSize(1n);
    const cardsNum = 1n << csize;
    const cardIndex = readInt(csize + 1n, csize);
    const afterCards = (csize << 1n) + (cardsNum << 1n) * (csize + 3n) + 1n;

    const ptrSize = readSize(afterCards)
    const ptrAddr = afterCards + ptrSize;
    const ptr = readInt(ptrAddr, ptrSize);

    if(mem[0]){
      let str = '';

      for(let i = ptrAddr + ptrSize << 1n; mem[i]; i += 2n)
        str += mem[i + 1n] ? 1 : 0;

      return Buffer.from(str);
    }

    const bit = read(ptr);
    const cardAddr = (csize << 1n) + ((cardIndex << 1n) | bit) * (csize + 3n) + 1n;

    const xor = read(cardAddr);
    const move = read(cardAddr + 1n);
    const dir = read(cardAddr + 2n);
    const newCardIndex = readInt(cardAddr + 3n, csize);

    if(DEBUG){
      const info = {
        parity,
        csize,
        cardsNum,
        cardIndex,
        afterCards,
        ptrSize,
        ptrAddr,
        ptr,
        bit,
        cardAddr,
        xor,
        move,
        dir,
        newCardIndex,
      };

      log(O.keys(info).map(key => {
        return `${key}: ${info[key]}`;
      }).join('\n'));

      debug();
    }

    if(move)
      writeInt(ptrAddr, ptrSize, ptr + (dir ? 1n : -1n));

    if(newCardIndex)
      writeInt(csize + 1n, csize, newCardIndex);

    if(xor)
      mem[ptr] = bit ^ 1n;
  }
};

module.exports = run;