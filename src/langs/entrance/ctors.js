'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

class Base extends O.Stringifiable{}

class System extends Base{
  constructor(rules){
    super();

    this.rules = rules;
  }

  toStr(){
    return this.join([], this.rules, '\n');
  }
}

class Rule extends Base{
  constructor(vars, premises, conclusion){
    super();

    this.vars = vars;
    this.premises = premises;
    this.conclusion = conclusion;
  }

  toStr(){
    const arr = [];

    if(this.vars.length !== 0){
      arr.push('[');
      this.join(arr, this.vars, ', ');
      arr.push('] ');
    }

    if(this.premises.length !== 0){
      this.join(arr, this.premises, ', ');
      arr.push(' |- ');
    }

    arr.push(this.conclusion);

    return arr;
  }
}

class VariableDefinition extends Base{
  constructor(name, constraints){
    super();

    this.name = name;
    this.constraints = constraints;
  }

  toStr(){
    const arr = [this.name];

    if(this.constraints.length !== 0){
      arr.push('\\{');
      this.join(arr, this.constraints, ', ');
      arr.push('}');
    }

    return arr;
  }
}

class Expression extends Base{
  constructor(name, args=[]){
    super();

    this.name = name;
    this.args = args;
  }

  get chNum(){ return this.args.length; }
  getCh(i){ return this.args[i]; }

  toStr(){
    const arr = [this.name];

    if(this.args.length !== 0){
      arr.push('(');
      this.join(arr, this.args, ', ');
      arr.push(')');
    }

    return arr;
  }
}


module.exports = {
  Base,
  System,
  Rule,
  VariableDefinition,
  Expression,
};