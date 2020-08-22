'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

class Base extends O.Stringifiable{}

class Program extends Base{
  constructor(lines){
    super();
    this.lines = lines;
  }

  toStr(){
    return this.join([], this.lines, '\n');
  }
}

class Line extends Base{
  constructor(lhs, rhs){
    super();
    this.lhs = lhs;
    this.rhs = rhs;
  }

  toStr(){
    const arr = [];

    if(this.lhs !== null)
      arr.push(this.lhs);

    arr.push(this.rhs);

    return arr;
  }
}

class Lhs extends Base{
  constructor(type, expr){
    super();
    this.type = type;
    this.expr = expr;
  }

  toStr(){
    const arr = [];

    if(this.expr !== null)
      arr.push(this.expr);

    arr.push(':;'[this.type]);

    return arr;
  }
}

class Rhs extends Base{
  constructor(expr){
    super();
    this.expr = expr;
  }

  toStr(){
    return this.expr;
  }
}

class Expression extends Base{}

class Operation extends Expression{
  constructor(type, op1, op2){
    super();
    this.type = type;
    this.op1 = op1;
    this.op2 = op2;
  }

  toStr(){
    const opName = {
      neq: '!=',
      equ: '==',
      sub: '-',
      add: '+',
      div: '/',
      mul: '*',
      exp: '^',
    }[this.type];

    return ['(', this.op1, ' ', opName, ' ', this.op2, ')'];
  }
}

class Input extends Expression{
  toStr(){
    return '?';
  }
}

class Number extends Expression{
  constructor(val){
    super();
    this.val = val;
  }

  toStr(){
    return String(this.val);
  }
}

module.exports = {
  Base,
  Program,
  Line,
  Lhs,
  Rhs,
  Expression,
  Operation,
  Input,
  Number,
};