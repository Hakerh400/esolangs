'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');

// Acronyms as defined in https://esolangs.org/wiki/GORBITSA#Implementations
const flags = {
  ROM: 1,

  parse: {
    PC: 0,
    PM: 0,
    PN: 1,
    PNN: 0,
  },

  input: {
    IC: 1,
    IM: 0,
    IN: 0,
    INN: 0,
  },

  output: {
    OC: 1,
    OM: 0,
    ON: 0,
    ONN: 0,
  },
};

const isBit = bit => {
  return bit === 0 || bit === 1;
};

for(const key of O.keys(flags)){
  const obj = flags[key];

  if(typeof obj !== 'object'){
    assert(isBit(obj));
    continue;
  }

  let found = 0;

  for(const key of O.keys(obj)){
    const val = obj[key];
    assert(isBit(val));
    assert(!(found && val));

    if(val) found = 1;
    flags[key] = val;
  }

  assert(found);
}

const instNames = 'gorbitsa';
const arities = [1, 1, 0, 1, 1, 0, 1, 1];

const run = (src, input) => {
  if(flags.IM){
    input = input.map(a => {
      if(a >= 0x30 && a <= 0x39) return a & ~0x30;
      return a;
    });
  }

  if(flags.IN || flags.INN){
    input = O.match(input.toString(), /\S+/g).map(a => {
      const pos = a[0] !== '-';

      if(!pos){
        if(!flags.INN)
          esolangs.err(`Invalid input number ${O.sf(a)}`);

        a = a.slice(1);
      }

      if(/^\d+$/.test(a)){
        let n = Number(a);

        if(n > 0xFF)
          esolangs.err(`Too large input number ${O.sf(a)}`);

        if(!pos) n = -n & 0xFF;
        return n;
      }

      esolangs.err(`Invalid input token ${O.sf(a)}`);
    });
  }

  let inputIndex = 0;
  const output = [];

  let done = 0;

  const chkb = byte => {
    assert(Object.is(byte, byte & 0xFF));
    return byte;
  };

  const inp = () => {
    if(inputIndex === input.length) return 0;
    return input[inputIndex++];
  };

  const out = byte => {
    chkb(byte);

    if(flags.OC && byte === 0){
      done = 1;
      return;
    }

    output.push(byte);
  };

  const useRam = !flags.ROM;

  const ram = Buffer.alloc(0x100);
  const rom = Buffer.alloc(0x200);
  const mem = useRam ? ram : rom;

  let pc = 0;
  let x = 0;
  let instsNum = 0;

  fillMem: {
    let index = 0;

    for(const [instStr] of O.exec(String(src).trim(), /\S+/g)){
      const err = msg => {
        esolangs.err(`Error in instruction ${O.sf(instStr)}\n${msg}`);
      };

      if(index === mem.length)
        err(`Memory overrun (maximum ${mem.length >> 1} instructions are allowed)`);

      const fst = instStr[0];
      const fstl = fst.toLowerCase();
      const ind = fst === fstl;

      const type = instNames.indexOf(fstl);

      mem[index++] = type | (ind ? 0x80 : 0);

      if(type === -1)
        err(`Invalid instruction name ${O.sf(fst)}`);

      const hasArg = ind || arities[type];

      if(hasArg === 0){
        if(instStr.length !== 1)
          err(`This instruction does not take arguments`);

        index++;
        continue;
      }

      let str = instStr.slice(1);
      let arg;

      parseArg: {
        if(str.length === 0)
          err(`Missing argument`);

        if(flags.PC){
          if(str.length !== 1)
            err(`Argument must be a single character`);

          arg = O.cc(str[0]);
          break parseArg;
        }

        let pos = 1;

        if(flags.PNN && str[0] === '-'){
          pos = 0;
          str = str.slice(1);
        }

        if(!/^\d+$/.test(str)){
          if(flags.PM && str.length === 1){
            arg = O.cc(str[0]);
            break parseArg;
          }

          err(`Argument must be a number`);
        }

        if(str[0] === '0' && str.length !== 1)
          err(`Non-zero number cannot start with a zero`);

        arg = Number(str);

        if(arg > 0xFF)
          err('Too large number (maximum is 255)');

        if(!pos) arg = -arg & 0xFF;
      }

      mem[index++] = arg;
    }

    instsNum = index >> 1;
  }

  if(instsNum === 0)
    return Buffer.alloc(0);

  const get = (addr, ind=0) => {
    chkb(addr);
    return !ind ? ram[addr] : ram[ram[addr]];
  };

  const set = (addr, val, ind=0) => {
    chkb(addr);
    chkb(val);
    return !ind ? ram[addr] = val : ram[ram[addr]] = val;
  };

  mainLoop: while(!done){
    const pd = pc << 1;
    const opcode = useRam ? mem[pc] : mem[pd];
    const arg = useRam ? mem[pc + 1 & 0xFF] : mem[pd + 1];
    const ind = opcode & 0x80;
    const dir = !ind;
    const op = opcode & 0x7F;

    switch(op){
      case 0: { // G
        x = get(arg, ind);
      } break;

      case 1: { // O
        set(arg, x, ind);
      } break;

      case 2: { // R
        if(dir) x = inp();
        else set(arg, inp());
      } break;

      case 3: { // B
        if(x) break;
        if(dir) pc = arg;
        else pc = get(arg);
        continue mainLoop;
      } break;

      case 4: { // I
        if(dir) x = x + arg & 0xFF;
        else set(arg, get(arg) + x & 0xFF);
      } break;

      case 5: { // T
        if(dir) out(x);
        else out(get(arg));
      } break;

      case 6: { // S
        if(dir) x = arg;
        else x ^= get(arg);
      } break;

      case 7: { // A
        x = x + get(arg, ind) & 0xFF;
      } break;

      default: {
        assert(useRam);
        esolangs.err(`Invalid opcode 0x${O.hex(op, 1)}`);
      } break;
    }

    if((pc >> useRam) === instsNum) break;
    pc = pc + (useRam ? 2 : 1) & 0xFF;
  }

  return (
    flags.OC ? Buffer.from(output) :
    flags.OM ? Buffer.from(output.map(a => a <= 9 ? a | 0x30 : a)) :
    flags.ON ? Buffer.from(output.join(' ')) :
    flags.ONN ? Buffer.from(new Int8Array(output).join(' ')) :
    assert.fail()
  );
};

module.exports = run;