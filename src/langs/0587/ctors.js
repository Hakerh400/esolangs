'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

class Base extends O.Stringifiable{}

class Expression extends Base{}

class Abstraction extends Expression{
  constructor(expr){
    super();
    this.expr = expr;
  }

  toStr(){
    return ['1', this.expr];
  }
}

class Application extends Expression{
  constructor(target, arg){
    super();
    this.target = target;
    this.arg = arg;
  }

  toStr(){
    return ['0', this.target, this.arg];
  }
}

class Function extends Expression{}

class NativeFunction extends Function{
  constructor(id){
    super();
    this.id = id;
  }

  toStr(){
    return global.String(this.id);
  }
}

class UserFunction extends Function{
  constructor(func){
    super();
    this.func = func;
  }

  toStr(){
    return `<function>`;
  }
}

class Value extends Expression{
  static from(str){
    if(/^(?:0|\-?[1-9][0-9]*)$/.test(str))
      return new Integer(BigInt(str));

    return new String(str);
  }

  constructor(val){
    super();
    this.val = val;
  }

  toStr(){
    return `(${this.val})`;
  }
}

class String extends Value{}

class Integer extends Value{}

class Null extends Value{
  constructor(){
    super(null);
  }

  toStr(){
    return `9`;
  }
}

module.exports = {
  Base,
  Expression,
  Abstraction,
  Application,
  Function,
  NativeFunction,
  UserFunction,
  Value,
  String,
  Integer,
  Null,
};