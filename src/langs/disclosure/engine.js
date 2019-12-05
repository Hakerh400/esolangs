'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../../..');
const cs = require('./ctors');

const DEBUG = 1;

const TAB_SIZE = 2;
const TAB = ' '.repeat(TAB_SIZE);

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
  lt:  0x0A,
  gt:  0x0B,
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
  ex: 0x07,
  fx: 0x08,
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
    const globalEnts = parsed.ents;

    if(!('main' in globalEnts))
      esolangs.err(`Missing definition for global function "main"`);

    const mainFunc = globalEnts.main;

    {
      if(mainFunc.entType !== 'function')
        esolangs.err(`Global entity "main" must be a function`);

      const {type} = mainFunc;
      if(!(type.name === 'void' && type.ptrs === 0))
        esolangs.err(`Global function "main" must return "void"`);

      const {args} = mainFunc;
      if(args.length !== 0)
        esolangs.err(`Global function "main" cannot have arguments`);
    }

    const asm = [];

    const label = a => asm.push(['label', a]);
    const inst = a => asm.push(['inst', a]);

    const data = (type, a) => asm.push(['data', type, a]);
    const num = a => asm.push(['data', 'num', a]);

    const mov = (a, b) => {
      inst(`mov ${a}, ${b}`);
    };

    const add = (a, b) => {
      const s = String(b);
      if(s === '0') return;
      if(s.startsWith('-')){
        b = -b;
        inst(`sub ${a}, ${b}`);
      }else{
        inst(`add ${a}, ${b}`);
      }
    };

    const sub = (a, b) => {
      const s = String(b);
      if(s === '0') return;
      if(s.startsWith('-')){
        b = -b;
        inst(`add ${a}, ${b}`);
      }else{
        inst(`sub ${a}, ${b}`);
      }
    };

    const mul = (a, b) => {
      if(String(b) !== '1')
        inst(`mul ${a}, ${b}`);
    };

    const div = (a, b) => {
      if(String(b) !== '1')
        inst(`div ${a}, ${b}`);
    };

    const inc = a => add(a, 1);
    const dec = a => sub(a, 1);

    const addr = (varIndex, auxReg='cx') => {
      if(varIndex === 0) return `[bp]`;
      mov(`cx`, `bp`);
      sub(`cx`, varIndex);
      return `[cx]`;
    };

    const push = a => {
      mov(`[sp]`, `${a}`);
      dec('sp');
    };

    const pop = a => {
      inc('sp');
      mov(`${a}`, `[sp]`);
    };

    const jmp = addr => {
      mov(`ip`, addr);
    };

    const callFunc = name => {
      inst('mov cx, ip');
      add('cx', 15);
      push('cx');
      mov(`ip`, `:func@${name}`);
      add('sp', globalEnts[name].args.length);
    };

    const ret = (a=null) => {
      if(a !== null) mov(`ax`, `${a}`);
      pop('cx');
      inst('mov ip, cx');
    };

    const enter = a => {
      push('bp');
      inst('mov bp, sp');
      sub(`sp`, a);
    };

    const leave = () => {
      inst('mov sp, bp');
      pop('bp');
      ret();
    };

    let blockLabelsNum = 0;

    const getStartLabel = block => {
      const labelIndex = block.labelIndex !== null ?
        block.labelIndex : block.labelIndex = blockLabelsNum++;

      block.hasStartLabel = 1;
      return `block@${labelIndex}-start`;
    };

    const getEndLabel = block => {
      const labelIndex = block.labelIndex !== null ?
        block.labelIndex : block.labelIndex = blockLabelsNum++;

      block.hasEndLabel = 1;
      return `block@${labelIndex}-end`;
    };

    num(':sys@start');
    num('-:sys@stack');
    num('-:sys@stack');
    num('0');
    num('0');
    num('0');
    num('0');
    num('0');
    num('0');

    label('sys@start');
    callFunc('main');
    inst('out 0, 1');

    const auxRegs = ['ax', 'bx'];

    for(const entName in globalEnts){
      const ent = globalEnts[entName];

      if(ent instanceof cs.FunctionDef){
        const func = ent;

        label(`func@${func.name}`);
        enter(func.body.vars.size);

        let block = func.body;

        const evalExpr = (expr, dest=0, otherFree=1) => {
          const stack = [['eval', dest, otherFree, expr]];

          while(stack.length !== 0){
            const elem = stack.shift();

            switch(elem[0]){
              case 'eval': {
                const dest = elem[1];
                const otherFree = elem[2];
                const val = elem[3];

                const other = dest ^ 1;
                const destReg = auxRegs[dest];
                const otherReg = auxRegs[other];

                if(val instanceof cs.Integer){
                  mov(destReg, val.val);
                  continue;
                }

                if(val instanceof cs.Identifier){
                  mov(destReg, addr(block.getOffset(val.name)));
                  continue;
                }

                if(val instanceof cs.BinaryOperation){
                  if(!otherFree){
                    push(otherReg);
                    stack.unshift(['pop', other]);
                  }

                  stack.unshift(
                    ['eval', dest, 1, val.op1],
                    ['eval', other, 0, val.op2],
                    ['apply', dest, val.constructor],
                  );
                  continue;
                }

                if(val instanceof cs.Call){
                  if(!(val.func instanceof cs.Identifier)) O.noimpl('Custom call');

                  const {name} = val.func;
                  if(!(name in globalEnts && globalEnts[name] instanceof cs.FunctionDef))
                    esolangs.err(`Undefined function ${O.sf(name)}`);

                  if(!otherFree){
                    push(otherReg);
                    stack.unshift(['pop', other]);
                  }

                  stack.unshift(
                    // ['eval', dest, otherFree, val.func],
                    ['apply', dest, val.constructor, val.func.name],
                  );

                  for(const arg of val.args){
                    stack.unshift(
                      ['eval', dest, otherFree, arg],
                      ['push', dest],
                    );
                  }

                  continue;
                }

                O.noimpl(val.constructor.name);
              } break;

              case 'apply': {
                const dest = elem[1];
                const op = elem[2];

                const other = dest ^ 1;
                const destReg = auxRegs[dest];
                const otherReg = auxRegs[other];

                switch(op){
                  case cs.Addition: add(auxRegs[dest], auxRegs[other]); break;
                  case cs.Subtraction: sub(auxRegs[dest], auxRegs[other]); break;
                  case cs.Multiplication: mul(auxRegs[dest], auxRegs[other]); break;
                  case cs.Division: div(auxRegs[dest], auxRegs[other]); break;

                  case cs.Call:
                    if(!otherFree) mov(`ex`, otherReg);
                    callFunc(elem[3]);
                    mov(destReg, `dx`);
                    if(!otherFree) mov(otherReg, `ex`);
                    break;

                  default: O.noimpl(op.name); break;
                }
              } break;

              case 'push': {
                push(auxRegs[elem[1]]);
              } break;

              case 'pop': {
                pop(auxRegs[elem[1]]);
              } break;
            }
          }
        };

        let lastReturn = 0;

        blocksLoop: while(block !== null){
          const {stats} = block;

          if(block.hasStartLabel){
            label(getStartLabel(block));
            block.hasStartLabel = 0;
          }

          while(stats.length !== 0){
            const stat = stats.shift();

            if(stat instanceof cs.CodeBlock){
              block = stat;
              continue blocksLoop;
            }

            if(stat instanceof cs.VariableDef){
              const expr = stat.val;
              if(expr === null) continue;

              lastReturn = 0;

              evalExpr(expr);
              mov(addr(block.getOffset(stat.name)), `ax`);
              continue;
            }

            if(stat instanceof cs.Return){
              evalExpr(stat.val);
              mov(`dx`, `ax`);
              leave();
              lastReturn = 1;
              continue;
            }

            lastReturn = 0;

            if(stat instanceof cs.If){
              const {cond, ifBlock, elseBlock} = stat;

              ifBlock.TYPE = 'IF';
              elseBlock.TYPE = 'ELSE';

              evalExpr(cond);
              inst(`eq ax, 0`);
              jmp(`:${getStartLabel(elseBlock)}`);

              ifBlock.onEnd = () => {
                jmp(`:${getEndLabel(elseBlock)}`);
              };

              stats.unshift(ifBlock, elseBlock);
              continue;
            }

            if(stat instanceof cs.Value){
              evalExpr(stat);
              continue;
            }

            O.noimpl(stat.constructor.name);
          }

          if(block.hasEndLabel){
            label(getEndLabel(block));
            block.hasEndLabel = 0;
          }

          if(block.onEnd !== null){
            block.onEnd();
            block.onEnd = null;
          }

          block = block.parent;
        }
        
        if(!lastReturn) leave();
        continue;
      }

      O.noimpl(ent.constructor.name);
    }

    label('sys@stack');

    if(DEBUG){
      const str = asm.map(line => {
        switch(line[0]){
          case 'label': return `${line[1]}:`; break;
          case 'data': return `${TAB}.${line[1]} ${line[2]}`; break;
          case 'inst': return `${TAB}${line[1]}`; break;
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

        str = str.replace(/\:([a-zA-Z0-9@\-_]+)/g, (a, b) => {
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