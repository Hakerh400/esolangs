'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const core = require('./core');

const SHOW_SUBSTS = 0;
const SHOW_REDUCED = 0;

class Base extends O.Stringifiable{}

class Program extends Base{
  funcsObj = O.obj();
  funcsArr = [];

  get mainFunc(){ return this.funcsArr[0]; }

  hasFunc(name){
    return O.has(this.funcsObj, name);
  }

  getFunc(name){
    assert(this.hasFunc(name), name);
    return this.funcsObj[name];
  }

  toStr(){
    return this.join([], this.funcsArr, '\n');
  }
}

class FunctionDefinition extends Base{
  constructor(name, args, expr){
    super();

    this.name = name;
    this.args = args;
    this.expr = expr;
  }

  get arity(){ return this.args.length; }

  toStr(){
    const arr = [this.name];

    for(const arg of this.args)
      arr.push(' ', arg);

    arr.push(' = ', this.expr, ';');
    return arr;
  }
}

class Reducible extends Base{
  reduced = null;

  showReduced(arr){
    if(!SHOW_REDUCED) return;
    if(!this.reduced) return;

    arr.push(' "');
    this.join(arr, this.reduced.map(a => core.getInfo(a)), ' ');
    arr.push('"');
  }
}

class Expression extends Reducible{
  idents = O.obj();

  constructor(target=null, args=[]){
    super();

    this.target = null;
    this.args = [];

    if(target !== null)
      this.setTarget(target);

    for(const arg of args)
      this.addArg(arg);
  }

  get arity(){ return this.args.length; }
  get hasArgs(){ return this.args.length !== 0; }

  hasIdent(ident){
    return O.has(this.idents, ident);
  }

  addIdent(ident){
    this.idents[ident] = 1;
    return this;
  }

  addIdents(idents){
    for(const ident in idents)
      this.addIdent(ident);

    return this;
  }

  copyIdents(expr){
    this.addIdents(expr.idents);
    return this;
  }

  setTarget(target){
    assert(this.target === null);
    this.target = target;
    return this.addIdent(target);
  }

  addArg(arg){
    this.args.push(arg);
    return this.copyIdents(arg);
  }

  toStr(){
    const {target, args} = this;
    const targetInfo = core.getInfo(target);

    if(args.length === 0)
      return targetInfo;

    const arr = [];

    arr.push(targetInfo);

    for(const arg of args){
      const {hasArgs} = arg;

      arr.push(' ');
      if(hasArgs) arr.push('(');
      arr.push(core.getInfo(arg));
      if(hasArgs) arr.push(')');
    }

    this.showReduced(arr);

    return arr;
  }
}

class Substitution extends Reducible{
  constructor(expr, idents){
    super();

    this.expr = expr;
    this.idents = idents;
  }

  toStr(){
    const {expr, idents} = this;
    const arr = [core.getInfo(expr)];

    if(SHOW_SUBSTS){
      arr.push(' [');

      const keys = O.keys(idents);

      for(let i = 0; i !== keys.length; i++){
        if(i !== 0) arr.push(', ');

        const key = keys[i];
        const val = idents[key];

        arr.push(key, ': ', core.getInfo(val));
      }

      arr.push(']');
    }

    this.showReduced(arr);

    return arr;
  }
}

class Reduce extends Base{
  constructor(ref, ioSym){
    super();

    this.ref = ref;
    this.ioSym = ioSym;
  }

  toStr(){
    return ['{{REDUCE}} ', this.ref];
  }
}

module.exports = {
  SHOW_SUBSTS,
  
  Base,
  Program,
  FunctionDefinition,
  Reducible,
  Expression,
  Substitution,
  Reduce,
};