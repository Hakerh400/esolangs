'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

class Base extends O.Stringifiable{}

class Program extends Base{
  constructor(elems){
    super();
    this.elems = elems;
  }

  toStr(){
    return this.join([], this.elems, ' ');
  }
}

class Element extends Base{
  copy(){ O.virtual('copy'); }
}

class Number extends Element{
  constructor(val){
    super();
    this.val = val;
  }

  static fromStr(str){
    if(str.length !== 1 && str[0] === '0')
      esolangs.err(`Invalid number ${O.sf(str)}`);

    return new Number(BigInt(str));
  }

  copy(){
    return new Number(this.val);
  }

  toStr(){
    return String(this.val);
  }
}

class Singleton extends Element{
  static instances = new Map();
  static kInst = Symbol('inst');

  constructor(key=null){
    super();

    const ctor = this.constructor;
    const insts = ctor.instances;
    const kInst = ctor.kInst;

    if(key === kInst){
      insts.set(ctor, this);
      return;
    }

    if(!insts.has(ctor))
      new ctor(kInst);

    assert(insts.has(ctor));
    return insts.get(ctor);
  }

  copy(){ return this; }
}

class Bind extends Singleton{
  toStr(){ return '.' }
}

class Call extends Singleton{
  toStr(){ return '~' }
}

class BindAndCall extends Singleton{
  toStr(){ return '*' }
}

class Clean extends Singleton{
  toStr(){ return '-' }
}

class Input extends Singleton{
  toStr(){ return 'in' }
}

class Output extends Singleton{
  toStr(){ return 'out' }
}

class Group extends Element{
  constructor(elems){
    super();
    this.elems = elems;
  }

  copy(){
    return new Group(this.elems.slice());
  }

  toStr(){
    const arr = ['('];
    this.join(arr, this.elems, ' ');
    arr.push(')');
    return arr;
  }
}

module.exports = {
  Base,
  Program,
  Element,
  Number,
  Singleton,
  Bind,
  Call,
  BindAndCall,
  Clean,
  Input,
  Output,
  Group,
};