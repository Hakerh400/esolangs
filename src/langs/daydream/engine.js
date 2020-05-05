'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');
const cs = require('./ctors');
const Memory = require('./memory');
const opArity = require('./arity');

const DEBUG = 0;

class Engine{
  constructor(parsed, input){
    this.parsed = parsed;
    this.input = input;
    this.output = null;
  }

  run(){
    const {parsed: prog, input} = this;
    const mem = new Memory();

    const getMemStr = (start=0n, len=50n) => {
      let str = '';

      for(let i = 0n; i !== len; i++){
        if(i !== 0n) str += ' ';
        str += mem.get(i);
      }

      return str;
    };

    // Initialize memory
    {
      const addrs = new Set();

      const set = (addr, val) => {
        if(addrs.has(addr))
          esolangs.err(`Sections overlap at address ${addr}`);

        mem.set(addr, val);
        addrs.add(addr);
      };

      for(const sect of prog.sects){
        const stack = [[sect.insts, 1n, 0n]];
        let addr = sect.start;

        while(stack.length !== 0){
          const info = O.last(stack);
          const [insts, rept, index] = info;

          if(rept === 0n){
            stack.pop();
            continue;
          }

          if(index === BigInt(insts.length)){
            info[1]--;
            info[2] = 0n;
            continue;
          }

          const inst = insts[index];
          info[2]++;

          if(typeof inst === 'bigint'){
            set(addr++, inst);
            continue;
          }

          if(inst instanceof cs.Repeat);{
            stack.push([inst.insts, inst.count, 0n]);
            continue;
          }

          assert.fail(inst);
        }
      }
    }

    mainLoop: while(1){
      if(DEBUG){
        log(getMemStr());
      }

      const regsAddr = mem.get(0n);

      const ipAddr = regsAddr;
      const bpAddr = regsAddr + 1n;
      const spAddr = regsAddr + 2n;

      let ip = mem.get(ipAddr);
      let bp = mem.get(bpAddr);
      let sp = mem.get(spAddr);

      const tr = mem.createTransaction();
      const inst = mem.get(ip);

      tr.set(ipAddr, ++ip);

      const push = val => {
        tr.set(sp, val);
        tr.set(spAddr, ++sp);
      };

      const pop = () => {
        tr.set(spAddr, --sp);
        return mem.get(sp);
      };

      const getElems = count => {
        const ops = [];

        for(let i = 0; i !== count; i++)
          ops.unshift(pop());

        return ops;
      };

      if(inst > 0n){
        if(DEBUG){
          log(`---> ${inst - 1n}`);
          debug();
        }

        push(inst - 1n);
        tr.commit();
        continue;
      }

      if(inst < 0n){
        const opCode = Number(~inst & 0x1Fn);
        const arity = opArity[opCode];
        const ops = getElems(arity);

        if(DEBUG){
          log(`${[
            'neg', 'inc', 'dec', 'and', 'or', 'xor', 'shl', 'shr',
            'add', 'sub', 'mul', 'div', 'eq', 'neq', 'lt', 'lte',
            'push', 'pop', 'get', 'set', 'geta', 'seta', 'getv', 'setv',
            'gets', 'sets', 'copy', 'if', 'jmp', 'call', 'enter', 'leave',
          ][opCode]} ${ops.join(' ')}`);
          debug();
        }

        switch(opCode + 1){
          case 0x01: // neg num
            push(-ops[0]);
            break;

          case 0x02: // inc num
            push(ops[0] + 1);
            break;

          case 0x03: // dec num
            push(ops[0] - 1);
            break;

          case 0x04: // and num1 num2
            push(ops[0] & ops[1]);
            break;

          case 0x05: // or num1 num2
            push(ops[0] | ops[1]);
            break;

          case 0x06: // xor num1 num2
            push(ops[0] ^ ops[1]);
            break;

          case 0x07: // shl num1 num2
            push(ops[0] << ops[1]);
            break;

          case 0x08: // shr num1 num2
            push(ops[0] >> ops[1]);
            break;

          case 0x09: // add num1 num2
            push(ops[0] + ops[1]);
            break;

          case 0x0A: // sub num1 num2
            push(ops[0] - ops[1]);
            break;

          case 0x0B: // mul num1 num2
            push(ops[0] * ops[1]);
            break;

          case 0x0C: // div num1 num2
            push(ops[0] / ops[1]);
            break;

          case 0x0D: // eq num1 num2
            push(ops[0] === ops[1] ? 1n : 0n);
            break;

          case 0x0E: // neq num1 num2
            push(ops[0] !== ops[1] ? 1n : 0n);
            break;

          case 0x0F: // lt num1 num2
            push(ops[0] < ops[1] ? 1n : 0n);
            break;

          case 0x10: // lte num1 num2
            push(ops[0] <= ops[1] ? 1n : 0n);
            break;

          case 0x11: // push size
            const size = ops[0];
            if(size === 0n) break;

            let start, end;

            if(size > 0n){
              start = sp - size;
              end = sp;
            }else{
              start = sp;
              end = sp + size;
            }

            for(let i = start; i !== end; i++)
              push(mem.get(i));

            break;

          case 0x12: // pop size
            sp -= ops[0];
            tr.set(spAddr, sp);
            break;

          case 0x13: // get addr
            push(mem.get(ops[0]));
            break;

          case 0x14: // set val addr
            tr.set(ops[1], ops[0]);
            break;

          case 0x15: // geta addr
            push(mem.get(bp - ops[0] - 3n));
            break;

          case 0x16: // seta val addr
            tr.set(bp - ops[1] - 3n, ops[0]);
            break;

          case 0x17: // getv addr
            push(mem.get(bp + ops[0]));
            break;

          case 0x18: // setv val addr
            tr.set(bp + ops[1], ops[0]);
            break;

          case 0x19: // gets addr
            push(mem.get(sp - ops[0] - 1n));
            break;

          case 0x1A: // sets val addr
            tr.set(sp - ops[1] - 1n, ops[0]);
            break;

          case 0x1B: // copy src size dest
            if(size === 0n) break;

            if(size > 0n){
              for(let i = 0; i !== size; i++)
                tr.set(dest + i, src + i);
            }else{
              const n = -size;

              for(let i = 0; i !== n; i++)
                tr.set(dest - i - 1n, src - i - 1n);
            }

            break;

          case 0x1C: // if num
            if((ops[0] & 1n) === 0n)
              tr.set(ipAddr, ++ip);
            break;

          case 0x1D: // jmp addr
            tr.set(ipAddr, ip = ops[0]);
            break;

          case 0x1E: // call addr
            push(ip);
            tr.set(ipAddr, ip = ops[0]);
            break;

          case 0x1F: // enter varsNum
            push(bp);
            tr.set(bpAddr, bp = sp);
            tr.set(spAddr, sp -= ops[0]);
            break;

          case 0x20: // leave argsNum retNum
            const retVals = getElems(ops[1]);

            tr.set(spAddr, sp = bp);
            tr.set(bpAddr, pop());
            tr.set(ipAddr, pop());
            tr.set(spAddr, sp -= ops[0]);

            for(const val of retVals)
              push(val);

            break;
        }

        tr.commit();
        continue;
      }

      const ioCode = (pop() % 3n + 3n) % 3n;

      switch(ioCode){
        case 0n: // Get input size
          push(BigInt(input.length));
          break;

        case 1n: // Get input buffer
          const dest = pop();

          input.forEach((byte, index) => {
            tr.set(dest + BigInt(index), BigInt(byte));
          });

          break;

        case 2n: // Output and halt
          const [src, size] = getElems(2);
          const arr = [];

          if(size > 0n){
            for(let i = 0n; i !== size; i++)
              arr.push(Number(mem.get(src + i) & 0xFFn));
          }

          this.output = Buffer.from(arr);
          break mainLoop;

          break;
      }

      tr.commit();
    }
  }
  
  getOutput(){
    return this.output;
  }
}

module.exports = Engine;