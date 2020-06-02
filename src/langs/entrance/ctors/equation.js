'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../../..');
const cs = require('.');

const {Base, Comparable, Queue} = cs;

class EquationsQueue extends Queue{
  #invalid = 0;

  pri = 0;

  get invalid(){ return this.#invalid; }

  push(eq){
    if(this.#invalid) return;

    const stack = [eq];

    while(stack.length !== 0){
      const eq = stack.pop();

      if(eq.pri >= 3){
        const {lhs, rhs} = eq;

        if(lhs.type === 1){
          if(rhs.type === 1 && rhs.identsOutsideCall.has(lhs.symbol)){
            this.invalidate();
            return;
          }

          if(rhs.type === 2 && rhs.symbol === lhs.symbol)
            continue;
        }

        super.push(eq);
        this.pri += eq.pri + 1;
        continue;
      }

      const {lhs, rhs} = stack;

      if(lhs.type !== rhs.type){
        this.invalidate();
        return;
      }

      if(lhs.type === 0){
        if(rhs.symbol !== lhs.symbol){
          this.invalidate();
          return;
        }
        continue;
      }

      if(lhs.type === 1){
        stack.push(
          new cs.Equation(lhs.fst, rhs.fst),
          new cs.Equation(lhs.snd, rhs.snd),
        );
        continue;
      }

      assert.fail(lhs.type);
    }
  }

  pop(){
    assert(!this.#invalid);
    return super.pop();
  }

  top(){
    assert(!this.#invalid);
    return super.top();
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