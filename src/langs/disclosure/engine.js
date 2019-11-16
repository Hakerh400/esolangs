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
    const int = a=> asm.push(['data', 'int', a]);

    int(':start');
    int('0');
    int('-:end');
    int('0');
    int('0');

    label('start');
    add('out 1, 3');
    add('out 2, 49');
    add('out 3, 50');
    add('out 4, 51');
    add('out 0, 1');

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
      return BigInt(parts[i]);
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

        str = str.replace(/\:([a-zA-Z0-9_]+)/g, (a, b) => {
          if(!(b in labels)) return 0;
          return labels[b];
        });

        if(type === 'data'){
          mem[addr++] = BigInt(str);
          continue;
        }

        const parts = str.split(/[\s\,]+/);
        const opName = parts[0];
        const op1 = parseOp(parts, 1);
        const op2 = parseOp(parts, 2);

        mem[addr++] = BigInt(ops[opName]);
        mem[addr++] = op1;
        mem[addr++] = op2;
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