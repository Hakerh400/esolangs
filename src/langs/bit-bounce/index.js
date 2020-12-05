'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const BitBuffer = require('../../common/bit-buffer');

const run = (src, input) => {
  src = src.toString();

  const mem = BitBuffer.from(src);
  const io = new O.IOBit(input);

  const ops = [
    ['const', 0, 1, () => {
      res = read(ip1++);
    }],
    ['jz', 2, 0, () => {
      if(!num1) ip1 = num2;
    }],
    ['call', 1, 1, () => {
      res = ip1;
      ip1 = num1;
    }],
    ['ret', 1, 0, () => {
      ip1 = num1;
    }],
    ['push', 0, 1, () => {
      res = read(sp);
    }],
    ['pop', 1, 0, () => {
    }],
    ['get', 1, 1, () => {
      res = read(sp + num1);
    }],
    ['set', 2, 0, () => {
      wrAddr = sp + num2;
      wrVal = num1;
    }],
    ['read', 1, 1, () => {
      res = read(num1);
    }],
    ['write', 2, 0, () => {
      wrAddr = num2;
      wrVal = num1;
    }],
    ['neg', 1, 1, () => {
      res = num1 ^ mask;
    }],
    ['imp', 2, 1, () => {
      res = (num1 ^ mask) | num2;
    }],
    ['shl', 2, 1, () => {
      if(num2 & upBit) res = num1 >> (num2 ^ mask) + 1;
      else res = num1 << num2;
    }],
    ['add', 2, 1, () => {
      res = num1 + num2;
    }],
    ['in', 0, 1, () => {
      res = io.read();
    }],
    ['out', 1, 0, () => {
      outb = Number(num1 & 1);
    }],
  ];

  const read = addr => {
    return mem.readInt((addr & mask) * size, size);
  };

  const write = (addr, num) => {
    mem.writeInt((addr & mask) * size, num & mask, size);
  };

  let size = 0;
  let mask = 0;
  let upBit = 0;

  let ptr = 0;
  let ip = 0;
  let sp = 0;
  let opc = 0;

  let addr = 0;
  let num1 = 0;
  let num2 = 0;
  let res = 0;

  let ip1 = 0;
  let wrAddr = 0;
  let wrVal = null;

  let inb = null;
  let outb = null;
  let odd = 0;

  let i = 0;

  while(1){
    i++;

    size = mem.readInt(0) + 4;
    mask = (1 << size) - 1;
    upBit = 1 << size - 1;

    ptr = read(1);
    ip = read(ptr);
    sp = read(ptr + 1);
    opc = Number(read(ip) & 15);

    const [name, argsNum, hasRes, func] = ops[opc];

    let argsStr;
    {
      if(argsNum === 1){
        num1 = read(sp);
        argsStr = `${num1}`;
      }else if(argsNum === 2){
        num1 = read(sp + 1);
        num2 = read(sp);
        argsStr = `(${num1}, ${num2})`;
      }else{
        argsStr = '/';
      }
    }

    ip1 = ip + 1;
    wrVal = null;
    inb = null;
    outb = null;

    func();

    {
      write(ptr, ip1);

      const dif = argsNum - hasRes;
      const sp1 = sp + dif;

      if(dif) write(ptr + 1, sp1);
      if(hasRes) write(sp1, res);
    }

    if(wrVal !== null) write(wrAddr, wrVal);

    if(outb !== null){
      if(!odd){ if(!outb) break; }
      else io.write(outb);
      odd ^= 1;
    }
  }

  return io.getOutput();
};

module.exports = run;