'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const Memory = require('./memory');

const maxInt = BigInt(Number.MAX_SAFE_INTEGER);

const run = (src, input) => {
  src = src.toString();
  input = Buffer.from(input);

  const mem = new Memory();
  const io = new Memory();
  let inputIndex = 0;

  const nums = src.split(',');

  nums.forEach((str, i) => {
    str = str.trim();

    if(!/^[\+\-]?\d+$/.test(str))
      throw new SyntaxError(`${O.sf(str)} is not a valid integer`);

    mem.set(BigInt(i), BigInt(str));
  });

  io.set(0n, BigInt(input.length));

  input.forEach((byte, i) => {
    io.set(BigInt(i + 1), BigInt(byte));
  });

  // 00 - mov dest, src
  // 01 - and dest, src
  // 02 - or  dest, src
  // 03 - xor dest, src
  // 04 - add dest, src
  // 05 - sub dest, src
  // 06 - mul dest, src
  // 07 - div dest, src
  // 08 - eq  src,  src
  // 09 - neq src,  src
  // 0A - le  src,  src
  // 0B - ge  src,  src
  // 0C - leq src,  src
  // 0D - geq src,  src
  // 0E - in  dest, src
  // 0F - out dest, src

  while(1){
    const ip = mem.get(0n);
    const inst = mem.get(ip);
    const opcode = inst & 15n;
    const isDest = opcode <= 0x07n || opcode >= 0x0En;

    const op1i = inst & 16n ? 1 : isDest || inst & 32n ? 0 : -1;
    const op1Addr = mem.get(ip + 1n, op1i);

    const shifted = !isDest && op1i !== 1;
    const op2i = inst & (shifted ? 64n : 32n) ? 1 : inst & (shifted ? 128n : 64n) ? 0 : -1;
    const op2Addr = mem.get(ip + 2n, op2i);

    log(String(op1Addr));
    log(String(op2Addr));
    break;
  }

  const outputLen = io.get(0n);
  if(outputLen < 0n) throw new TypeError('Output length cannot be negative');
  if(outputLen > maxInt) throw new TypeError('Output length is too large');

  const output = Buffer.alloc(Number(outputLen));

  for(let i = 0; i !== output.length; i++)
    output[i] = Number(io.get(BigInt(i + 1)) & 255n);

  return output;
};

module.exports = run;