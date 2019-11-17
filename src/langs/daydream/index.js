'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');
const Memory = require('./memory');

const DEBUG = 1;

const maxInt = BigInt(Number.MAX_SAFE_INTEGER);

const run = (src, input) => {
  src = src.toString().trim();
  input = Buffer.from(input);

  const mem = new Memory();
  const io = new Memory();
  let inputIndex = 0;

  const nums = src.length !== 0 ? src.split(',') : [];

  nums.forEach((str, i) => {
    str = str.trim();

    if(!/^[\+\-]?\d+$/.test(str))
      throw new SyntaxError(`${O.sf(str)} is not a valid integer`);

    mem.set(BigInt(i), BigInt(str));
  });

  io.set(0n, 0n);
  io.set(1n, BigInt(input.length));

  input.forEach((byte, i) => {
    io.set(BigInt(i + 2), BigInt(byte));
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
    const opcode = Number(inst & 15n);
    const isDest = opcode <= 0x07 || opcode >= 0x0E;

    const op1i = inst & 16n ? 1 : isDest || (inst & 32n) ? 0 : -1;
    const op1Addr = mem.get(ip + 1n, op1i);

    const shifted = !isDest && op1i !== 1;
    const op2i = inst & (shifted ? 64n : 32n) ? 1 : inst & (shifted ? 128n : 64n) ? 0 : -1;
    const op2Addr = mem.get(ip + 2n, op2i);

    if(DEBUG){
      log(`\n${'='.repeat(100)}\n`);
      log(O.ca(75, i => {
        i = BigInt(i);
        let str = String(mem.get(i));

        if(i === ip) str = ` [${str}`;
        else if(i === ip + 2n) str = `${str}] `;

        return str;
      }).join(','));

      const formatOp = (op, ind) => {
        return `${'['.repeat(ind + 1)}${op}${']'.repeat(ind + 1)}`;
      };

      const opName = 'mov,and,or,xor,add,sub,mul,div,eq,neq,le,ge,leq,geq,in,out'.split(',')[opcode];
      const op1 = mem.get(ip + 1n);
      const op2 = mem.get(ip + 2n);

      let inst = `\n${opName} ${formatOp(op1, op1i)}, ${formatOp(op2, op2i)}`.
        replace(/\[0\]/g, 'ip').
        replace(/\[1\]/g, 'bp').
        replace(/\[2\]/g, 'sp').
        replace(/\[3\]/g, 'ax').
        replace(/\[4\]/g, 'bx').
        replace(/\[5\]/g, 'cx').
        replace(/\[6\]/g, 'dx');

      log(inst);

      debug();
    }

    if(opcode <= 0x07){
      const op1 = opcode !== 0x00 ? mem.get(op1Addr) : null;
      const op2 = mem.get(op2Addr);
      let res;

      switch(opcode){
        case 0x00: res = op2; break;
        case 0x01: res = op1 & op2; break;
        case 0x02: res = op1 | op2; break;
        case 0x03: res = op1 ^ op2; break;
        case 0x04: res = op1 + op2; break;
        case 0x05: res = op1 - op2; break;
        case 0x06: res = op1 * op2; break;
        case 0x07: res = op2 !== 0n ? op1 / op2 : 0n; break;
      }

      mem.set(0n, ip + 3n);
      mem.set(op1Addr, res);

      continue;
    }

    if(opcode <= 0x0D){
      const op1 = mem.get(op1Addr);
      const op2 = mem.get(op2Addr);
      let cond;

      switch(opcode){
        case 0x08: cond = op1 === op2; break;
        case 0x09: cond = op1 !== op2; break;
        case 0x0A: cond = op1 < op2; break;
        case 0x0B: cond = op1 > op2; break;
        case 0x0C: cond = op1 <= op2; break;
        case 0x0D: cond = op1 >= op2; break;
      }

      mem.set(0n, ip + (cond ? 3n : 6n));

      continue;
    }

    if(opcode === 0x0E){
      const addr = mem.get(op2Addr);
      const val = io.get(addr);

      mem.set(0n, ip + 3n);
      mem.set(op1Addr, val);

      continue;
    }

    const val = mem.get(op2Addr);

    io.set(op1Addr, val);

    if(op1Addr === 0n && (val & 1n) !== 0)
      break;

    mem.set(0n, ip + 3n);
  }

  const outputLen = io.get(1n);
  if(outputLen < 0n) throw new TypeError('Output length cannot be negative');
  if(outputLen > maxInt) throw new TypeError('Output length is too large');

  const output = Buffer.alloc(Number(outputLen));

  for(let i = 0; i !== output.length; i++)
    output[i] = Number(io.get(BigInt(i + 2)) & 255n);

  return output;
};

module.exports = run;