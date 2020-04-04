'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

class Base{}

class Script extends Base{
  constructor(stats){
    super();
    
    if(O.last(stats) instanceof End)
      stats.pop();

    this.stats = stats;
  }
}

class Assignments extends Base{
  constructor(arr){
    super();
    this.arr = arr;
  }
}

class Assignment extends Base{
  constructor(ident, expr){
    super();
    this.ident = ident;
    this.expr = expr;
  }
}

class Control extends Base{}

class If extends Control{
  constructor(cond, stat1, stat2){
    super();
    this.cond = cond;
    this.stat1 = stat1;
    this.stat2 = stat2;
  }
}

class For extends Control{
  initialized = 0;

  constructor(stat1, cond, stat2, stats){
    super();
    this.stat1 = stat1;
    this.cond = cond;
    this.stat2 = stat2;
    this.stats = stats;
  }
}

class Say extends Base{
  constructor(expr, newLine){
    super();
    this.expr = expr;
    this.newLine = newLine;
  }
}

class Operation extends Base{}

class BinaryOperation extends Operation{
  constructor(op1, op2){
    super();
    this.op1 = op1;
    this.op2 = op2;
  }
}

class Addition extends BinaryOperation{}
class Subtraction extends BinaryOperation{}

class Compare extends BinaryOperation{}
class Equals extends Compare{}
class LessThan extends Compare{}
class GreaterThan extends Compare{}
class LessThanOrEqual extends Compare{}
class GreaterThanOrEqual extends Compare{}

class LogicalOperation extends BinaryOperation{
  static construct(arr, seps){
    return arr.reduce((a, b, i) => {
      const ctor = seps[i - 1].toLowerCase() === 'and' ? And : Or;
      return new ctor(a, b);
    });
  }
}

class And extends LogicalOperation{}
class Or extends LogicalOperation{}

class Identifier extends Base{
  constructor(name){
    super();
    this.name = name;
  }
}

class Literal extends Base{}

class Integer extends Literal{
  constructor(val){
    super();
    this.val = val;
  }
}

class String extends Literal{
  constructor(val){
    super();
    this.val = val;
  }
}

class End extends Base{}

module.exports = {
  Base,
  Script,
  Assignments,
  Assignment,
  Control,
  If,
  For,
  Say,
  Operation,
  BinaryOperation,
  Addition,
  Subtraction,
  Compare,
  Equals,
  LessThan,
  GreaterThan,
  LessThanOrEqual,
  GreaterThanOrEqual,
  LogicalOperation,
  And,
  Or,
  Identifier,
  Literal,
  Integer,
  String,
  End,
};