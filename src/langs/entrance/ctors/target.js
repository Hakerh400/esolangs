'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../../..');
const cs = require('.');

const {Base, Comparable, Queue} = cs;

class TargetsQueue extends Queue{
  symbols = new Set();
  pri = 0;

  push(target){
    const {symbols} = this;
    const stack = [target];

    while(stack.length !== 0){
      const target = stack.pop();
      const {expr} = target;
      const {type} = expr;

      switch(type){
        case 0: break;

        case 1:
          stack.push(
            new Target(expr.fst),
            new Target(expr.snd),
          );
          break;

        case 2:
          const sym = expr.symbol;
          if(symbols.has(sym)) break;

          super.push(target);
          this.pri += expr.pri;
          symbols.add(sym);

          break;

        case 3:
          super.push(target);
          this.pri += expr.pri;
          break;

        default:
          assert.fail(type);
          break;
      }
    }
  }

  toStr(){
    if(this.len === 0) return '/';

    const arr = [this.inc, '\n'];
    this.join(arr, this.arr, '\n');
    arr.push(this.dec);

    return arr;
  }
}

class Target extends Comparable{
  pri = 0;

  constructor(expr){
    super();

    this.expr = expr;
    this.pri = expr.type === 3 ? 0 : 1;
  }

  cmp(target){
    return this.pri - target.pri;
  }

  subst(identSym, exprNew){
    return new Target(
      this.expr.subst(identSym, exprNew),
    );
  }

  toStr(){
    const {expr} = this;
    const arr = [expr.symbol];

    if(expr.type === 3)
      arr.push(': ', expr);

    return arr;
  }
}

const ctors = {
  TargetsQueue,
  Target,
};

Object.assign(cs, ctors);
module.exports = cs;