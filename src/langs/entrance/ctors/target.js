'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../../..');
const cs = require('.');

const {Base, Comparable, Queue} = cs;

class TargetsQueue extends Queue{
  pri = 0;

  push(target){
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

        case 2: case 3:
          super.push(target);
          this.pri++;
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

  toStr(){
    return [this.expr.symbol, ': ', this.expr];
  }
}

const ctors = {
  TargetsQueue,
  Target,
};

Object.assign(cs, ctors);
module.exports = cs;