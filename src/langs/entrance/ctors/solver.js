'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../../..');
const cs = require('.');

const {Base, Comparable, Queue} = cs;

class Solver extends Queue{
  constructor(system, target){
    super();

    const targets = new TargetsQueue();
    const equations = new EquationsQueue();

    targets.push(target);

    const state = new State(system, null, targets, equations);

    this.push(state);
  }

  toStr(){
    if(this.len === 0) return '/';
    return this.join([], this.arr, '\n\n');
  }
}

class State extends Comparable{
  constructor(system, transition, targets, equations){
    super();

    this.system = system;
    this.transition = transition;
    this.targets = targets;
    this.equations = equations;

    this.id = system.generateSymbol();
  }

  toStr(){
    return [
      'State ', this.id, ':', this.inc, '\n',
      'transition: ', this.transition !== null ? this.transition : '/', '\n',
      'targets: ', this.targets, '\n',
      'equations: ', this.equations, this.dec,
    ];
  }
}

class TargetsQueue extends Queue{
  toStr(){
    if(this.len === 0) return '/';

    const arr = [this.inc, '\n'];
    this.join(arr, this.arr, '\n');
    arr.push(this.dec);

    return arr;
  }
}

class Target extends Comparable{
  constructor(expr){
    super();

    this.expr = expr;
  }

  cmp(target){
    return 0;
  }
}

class EquationsQueue extends Queue{
  #invalid = 0;

  get invalid(){ return this.#invalid; }

  push(eq){
    if(this.#invalid) return;
    const {lhs, rhs} = eq;
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

    this.lhs = lhs;
    this.rhs = rhs;

    this.pri = lhs.pri + rhs.pri;
  }

  cmp(target){
    return this.pri - target.pri;
  }
}

class Transition extends Base{
  constructor(from){
    super();

    this.from = from;
  }
}

const ctors = {
  Solver,
  State,
  TargetsQueue,
  Target,
  EquationsQueue,
  Equation,
  Transition,
};

Object.assign(cs, ctors);
module.exports = cs;