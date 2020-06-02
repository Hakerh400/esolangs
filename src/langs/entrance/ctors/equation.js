'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../../..');
const cs = require('.');

const {Base, Comparable, Queue} = cs;

class EquationsQueue extends Queue{
  pri = 0;

  push(eq){
    const stack = [eq];

    while(stack.length !== 0){
      const eq = stack.pop();
      const {lhs, rhs} = eq;
      const type1 = lhs.type;
      const type2 = rhs.type;

      if(type1 === 2 || type1 === 3){
        if(type1 === 2){
          if(type2 === 1 && rhs.identsOutsideCall.has(lhs.symbol))
            return 0;

          if(type2 === 2 && lhs.symbol === rhs.symbol)
            continue;
        }

        super.push(eq);
        this.pri += lhs.pri + rhs.pri;
        continue;
      }

      if(type1 !== type2){
        return 0;
      }

      if(type1 === 0){
        if(rhs.symbol !== lhs.symbol)
          return 0;

        continue;
      }

      if(type1 === 1){
        stack.push(
          new cs.Equation(lhs.fst, rhs.fst),
          new cs.Equation(lhs.snd, rhs.snd),
        );

        continue;
      }

      assert.fail(type1);
    }

    return 1;
  }

  toStr(){
    if(this.len === 0) return '/';

    const arr = [this.inc, '\n'];
    this.join(arr, this.arr, '\n');
    arr.push(this.dec);
    
    return arr;
  }
}

class Equation extends Comparable{
  constructor(lhs, rhs){
    super();

    if(lhs.type < rhs.type){
      const t = lhs;
      lhs = rhs;
      rhs = t;
    }

    this.lhs = lhs;
    this.rhs = rhs;

    this.pri = lhs.pri + rhs.pri;
  }

  cmp(target){
    return this.pri - target.pri;
  }

  subst(identSym, exprNew){
    return new Equation(
      this.lhs.subst(identSym, exprNew),
      this.rhs.subst(identSym, exprNew),
    );
  }

  toStr(){
    const arr = [];

    if(cs.DISPLAY_PRIORITY)
      arr.push('[', this.pri, '] ');

    arr.push(this.lhs, ' = ', this.rhs);
    return arr;
  }
}

const ctors = {
  EquationsQueue,
  Equation,
};

Object.assign(cs, ctors);
module.exports = cs;