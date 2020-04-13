'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

class Base extends O.Stringifiable{}

class Program extends Base{
  constructor(funcsArr){
    super();

    this.funcsArr = funcsArr;
    const funcsObj = this.funcsObj = O.obj();

    for(const func of funcsArr){
      const {name} = func;

      if(name in funcsObj)
        esolangs.err(`Multiple definitions for function ${
          O.sf(name)}\n\n${
          funcsObj[name]}\n\n${
          func}`);

      funcsObj[name] = func;
    }

    if(!('main' in funcsObj))
      esolangs.err(`Missing definition for main function "main"`);
  }

  toStr(){
    return this.join([], this.funcsArr, '\n\n');
  }
}

class Function extends Base{
  constructor(name, args, body){
    super();

    this.name = name;
    this.args = args;
    this.body = body;
  }

  toStr(){
    const arr = [];

    arr.push(this.name, '(');
    this.join(arr, this.args, ', ');
    arr.push(')', this.body);

    return arr;
  }
}

class Block extends Base{
  constructor(stats){
    super();

    this.stats = stats;
  }

  toStr(){
    const {stats} = this;
    const arr = [];

    if(stats.length !== 0){
      arr.push(this.inc, '{\n');
      this.join(arr, stats, '\n');
      arr.push(this.dec, '\n}');
    }else{
      arr.push('{}');
    }

    return arr;
  }
}

class Statement extends Base{}

class ExpressionStatement extends Statement{
  constructor(expr){
    super();

    this.expr = expr;
  }

  toStr(){
    return this.expr;
  }
}

class Assignment extends Statement{
  constructor(name, expr){
    super();

    this.name = name;
    this.expr = expr;
  }

  toStr(){
    return [this.name, ' = ', this.expr];
  }
}

class VariableDefinition extends Statement{
  constructor(name){
    super();

    this.name = name;
  }

  toStr(){
    return ['var ', this.name];
  }
}

class Return extends Statement{
  constructor(expr){
    super();

    this.expr = expr;
  }

  toStr(){
    return ['return ', this.expr];
  }
}

class Expression extends Base{}

class Watch extends Expression{
  constructor(){
    super();
  }

  toStr(){
    return 'watch';
  }
}

class WatchOperation extends Expression{
  constructor(watch){
    super();

    this.watch = watch
  }

  get opName(){ O.virtual('opName'); }

  toStr(){
    return [this.opName, ' ', this.watch];
  }
}

class Start extends WatchOperation{
  get opName(){ return 'start'; }
}

class Sleep extends WatchOperation{
  get opName(){ return 'sleep'; }
}

class Split extends WatchOperation{
  get opName(){ return 'split'; }
}

class Time extends WatchOperation{
  get opName(){ return 'time'; }
}

class Stop extends WatchOperation{
  get opName(){ return 'stop'; }
}

class Literal extends Expression{}

class Integer extends Literal{
  constructor(val){
    super();

    this.val = val;
  }

  toStr(){
    return [String(this.val)];
  }
}

module.exports = {
  Base,
  Program,
  Function,
  Block,
  Statement,
  ExpressionStatement,
  Assignment,
  VariableDefinition,
  Return,
  Expression,
  Watch,
  WatchOperation,
  Start,
  Sleep,
  Split,
  Time,
  Stop,
  Literal,
  Integer,
};