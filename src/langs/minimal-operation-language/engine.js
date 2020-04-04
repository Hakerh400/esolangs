'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const logSync = require('../../common/log-sync');
const rlSync = require('../../common/rl-sync');
const cs = require('./ctors');

class Engine{
  constructor(parsed, input){
    this.parsed = parsed;

    this.interactive = input === null;
    this.input = !this.interactive ? String(input).trim().split(/\s+/) : [];
    this.output = !this.interactive ? '' : null;
  }

  run(){
    const {parsed: prog} = this;
    const {lines} = prog;

    const evalExpr = expr => {
      const map = new Map();
      const stack = [expr];

      while(stack.length !== 0){
        const expr = stack.pop();

        if(expr instanceof cs.Number){
          map.set(expr, expr.val);
          continue;
        }

        if(expr instanceof cs.Input){
          map.set(expr, this.in());
          continue;
        }

        if(expr instanceof cs.Operation){
          const {op1, op2} = expr;

          if(!map.has(op1)){
            stack.push(expr, op2, op1);
            continue;
          }

          const n1 = map.get(op1);
          const n2 = map.get(op2);

          switch(expr.type){
            case 'neq': map.set(expr, n1 !== n2); break;
            case 'equ': map.set(expr, n1 === n2); break;
            case 'sub': map.set(expr, n1 - n2); break;
            case 'add': map.set(expr, n1 + n2); break;
            case 'div': map.set(expr, n1 / n2); break;
            case 'mul': map.set(expr, n1 * n2); break;
            case 'exp': map.set(expr, n1 ^ n2); break;
            default: assert.fail(expr.type); break;
          }

          continue;
        }

        assert.fail(expr);
      }

      return map.get(expr);
    };

    let index = 0;

    while(1){
      if(index !== (index | 0)) break;
      if(index < 0 || index >= lines.length) break;

      const line = lines[index];
      const {lhs, rhs} = line;

      const n1 = lhs !== null && lhs.expr !== null ? evalExpr(lhs.expr) : null;
      const n2 = evalExpr(rhs.expr);

      if(lhs === null || lhs.type === 1)
        this.out(n2);

      index = lhs !== null && n1 !== 0 ? n2 : index + 1;
    }
  }

  in(){
    const {input} = this;

    if(input.length === 0){
      if(!this.interactive) return 0;

      logSync('> ');

      const line = rlSync();
      const parts = line.trim().split(/\s+/);

      for(const part of parts)
        input.push(part);
    }

    const str = input.shift();
    const num = Number(str);

    return !isNaN(num) ? num : 0;
  }

  out(num){
    if(!this.interactive){
      this.output += `${num}\n`;
      return;
    }

    log(num);
  }
  
  getOutput(){
    return this.output;
  }
}

module.exports = Engine;