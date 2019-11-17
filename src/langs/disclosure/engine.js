'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../../..');
const cs = require('./ctors');

const DEBUG = 1;

const ops = {
  mov: 0x00,
  and: 0x01,
  or:  0x02,
  xor: 0x03,
  add: 0x04,
  sub: 0x05,
  mul: 0x06,
  div: 0x07,
  eq:  0x08,
  neq: 0x09,
  le:  0x0A,
  ge:  0x0B,
  leq: 0x0C,
  geq: 0x0D,
  in:  0x0E,
  out: 0x0F,
};

const regs = {
  ip: 0x00,
  bp: 0x01,
  sp: 0x02,
  ax: 0x03,
  bx: 0x04,
  cx: 0x05,
  dx: 0x06,
};

class Engine{
  constructor(parsed, input){
    this.parsed = parsed;
    this.input = input;
    this.output = null;
  }

  run(){
    const asm = this.generateAssembly();
    const src = this.compile(asm);

    this.output = esolangs.run('Daydream', src, '');
  }

  generateAssembly(){
    const {parsed, input} = this;
    const {ents} = parsed;

    if(!('main' in ents))
      throw new TypeError(`Missing definition for global function "main"`);

    const mainFunc = ents.main;

    {
      if(mainFunc.entType !== 'function')
        throw new TypeError(`Global entity "main" must be a function`);

      const {type} = mainFunc;
      if(!(type.name === 'void' && type.ptrs === 0))
        throw new TypeError(`Global function "main" must return "void"`);

      const {args} = mainFunc;
      if(args.length !== 0)
        throw new TypeError(`Global function "main" cannot have arguments`);
    }

    const asm = [];

    const label = a => asm.push(['label', a]);
    const add = a => asm.push(['inst', a]);

    const data = (type, a) => asm.push(['data', type, a]);
    const int = a => asm.push(['data', 'int', a]);

    const inc = a => add(`add ${a}, 1`);
    const dec = a => add(`sub ${a}, 1`);

    const push = a => {
      add(`mov [sp], ${a}`);
      dec('sp');
    };

    const pop = a => {
      inc('sp');
      add(`mov ${a}, [sp]`);
    };

    const call = (a, b=0) => {
      add('mov dx, ip');
      add('add dx, 15');
      push('dx');
      add(`mov ip, ${a}`);
      if(b !== 0) add(`add sp, ${b}`);
    };

    const ret = (a=null) => {
      if(a !== null) add(`mov ax, ${a}`);
      pop('dx');
      add('mov ip, dx');
    };

    const enter = a => {
      push('bp');
      add('mov bp, sp');
      add(`sub sp, ${a}`);
    };

    const leave = a => {
      add('mov sp, bp');
      pop('bp');
      ret();
    };

    int(':start');
    int('0');
    int('-:end');
    int('0');
    int('0');

    label('start');
    call(':@main');
    add('out 0, 1');

    label(`@${mainFunc.name}`);
    enter(mainFunc.vars.size);
    leave(0);

    label('end');

    if(DEBUG){
      const str = asm.map(line => {
        switch(line[0]){
          case 'label': return `${line[1]}:`; break;
          case 'data': return `.${line[1]} ${line[2]}`; break;
          case 'inst': return line[1]; break;
        }
      }).join('\n');

      log(`\n${str}\n`);
    }

    return asm;
  }

  compile(asm){
    const mem = [];

    const parseOp = (parts, index) => {
      const i = index--;
      if(i >= parts.length) return null;

      const str = parts[i];
      const indirection = str.match(/^\[*/)[0].length;
      const op = BigInt(str.slice(indirection, str.length - indirection));

      return [op, indirection - 1];
    };

    const labels = O.obj();
    let updatedLabel = 0;

    do{
      let addr = 0;

      updatedLabel = 0;

      for(const line of asm){
        const type = line[0];
        let str = O.last(line);

        if(type === 'label'){
          if(!(str in labels) || labels[str] !== addr){
            labels[str] = addr;
            updatedLabel = 1;
          }
          continue;
        }

        str = str.replace(/\:([a-zA-Z0-9@_]+)/g, (a, b) => {
          if(!(b in labels)) return 0;
          return labels[b];
        });

        for(const reg in regs){
          const regex = new RegExp(`\\b${reg}\\b`, 'g');
          str = str.replace(regex, `[${regs[reg]}]`);
        }

        if(type === 'data'){
          mem[addr++] = BigInt(str);
          continue;
        }

        const parts = str.split(/[\s\,]+/);
        const opName = parts[0];
        const opcode = ops[opName];

        const op1 = parseOp(parts, 1);
        const op2 = parseOp(parts, 2);

        const isDest = opcode <= 0x07 || opcode >= 0x0E;
        const shifted = !isDest && op1[1] !== 1;

        const op1i = op1[1];
        const op2i = op2[1];

        let inst = BigInt(opcode);

        if(op1i === 1) inst |= 16n;
        else if(op1i === 0 && !isDest) inst |= 32n;

        if(op2i === 1) inst |= shifted ? 64n : 32n;
        else if(op2i === 0) inst |= shifted ? 128n : 64n;

        mem[addr++] = inst;
        mem[addr++] = op1[0];
        mem[addr++] = op2[0];
      }
    }while(updatedLabel);

    const src = mem.join(',');

    return src;
  }
  
  getOutput(){
    return this.output;
  }
}

module.exports = Engine;