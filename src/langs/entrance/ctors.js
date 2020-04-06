'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

const SHOW_IDENT_INFO = 1;

class Base extends O.Stringifiable{}

class Program extends Base{
  constructor(mode){
    super();

    this.mode = mode;
  }

  toStr(){
    const {mode} = this;
    const arr = ['# ', mode.modeName];

    if(SHOW_IDENT_INFO){
      if(mode.identsNum !== 0){
        arr.push('\n', this.prefixPush, '// ', '\n');
        this.join(arr, mode.identsArr, '\n\n');
        arr.push(this.prefixPop);
      }
    }

    arr.push('\n\n', mode);

    return arr;
  }
}

class Mode extends Base{
  #identsInfo = O.obj();
  #identsNum = 0;

  get identsNum(){ return this.#identsNum; }
  get identsArr(){ return Object.values(this.#identsInfo); }
  hasInfo(name){ return name in this.#identsInfo; }
  getInfo(name){ return this.#identsInfo[name]; }

  setInfo(name, info){
    if(name in this.#identsInfo){
      const infoCur = this.#identsInfo[name];

      if(info.arity !== infoCur.arity)
        esolangs.err(`Arity mismatch for identifier ${O.sf(name)}`);

      return;
    }

    this.#identsInfo[name] = info;
    this.#identsNum++;
  }

  initInfo(){
    this.topDown(elem => {
      if(!(elem instanceof Expression)) return;

      const info = new IdentifierInfo(elem.name, elem.arity);
      this.setInfo(elem.name, info);
    });
  }

  get modeName(){ return O.virtual('modeName'); }
}

class ModeSolve extends Mode{
  constructor(vars, eqs){
    super();

    this.vars = vars;
    this.eqs = eqs;

    this.initInfo();

    for(const varDef of vars){
      const {name, constraints} = varDef;

      if(!this.hasInfo(name)){
        this.setInfo(name, new IdentifierInfo(name, 0, 1));
        continue;
      }

      const info = this.getInfo(name);

      if(info.isVar === 1)
        esolangs.err(`Redefinition of variable ${O.sf(name)}`);

      info.isVar = 1;
      info.constraints = constraints;
    }

    for(const varDef of vars){
      const {name, constraints} = varDef;

      for(const constraint in constraints){
        if(constraint === '#') continue;

        if(!this.hasInfo(constraint)){
          delete constraints[constraint];
          constraints['#']--;
          continue;
        }

        const info = this.getInfo(constraint);

        if(info.isVar)
          esolangs.err(`Constraint ${
            O.sf(constraint)} for variable ${
            O.sf(name)} is invalid`);
      }
    }
  }

  get modeName(){ return 'solve'; }

  get chNum(){ return this.eqs.length; }
  getCh(i){ return this.eqs[i]; }

  toStr(){
    const arr = [];

    if(this.vars.length !== 0){
      arr.push('[');
      this.join(arr, this.vars, ', ');
      arr.push(']\n\n');
    }

    if(this.eqs.length !== 0)
      this.join(arr, this.eqs, '\n');

    return arr;
  }
}

class ModeProve extends Mode{
  constructor(rules){
    super();

    this.rules = rules;
    O.noimpl('ModeProve');
  }

  get modeName(){ return 'prove'; }

  get chNum(){ return this.rules.length; }
  getCh(i){ return this.rules[i]; }

  toStr(){
    return this.join([], this.rules, '\n');
  }
}

class Equation extends Base{
  constructor(lhs, rhs){
    super();

    this.lhs = lhs;
    this.rhs = rhs;
  }

  get chNum(){ return 2; }
  getCh(i){ return i === 0 ? this.lhs : this.rhs; }

  toStr(){
    return [this.lhs, ' = ', this.rhs];
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
  constructor(name, constraints=[]){
    super();

    this.name = name;

    const constraintsObj = O.obj();
    constraintsObj['#'] = 0;

    for(const constraint of constraints){
      if(constraint in constraintsObj)
        esolangs.err(`Duplicate constraint ${
          O.sf(constraint)} in the definition of variable ${
          O.sf(name)}`);

      constraintsObj[constraint] = 1;
      constraintsObj['#']++;
    }


    this.constraints = constraintsObj;
  }

  toStr(){
    const arr = [this.name];

    if(this.constraints['#'] !== 0){
      arr.push('\\{');
      this.join(arr, O.keys(this.constraints).filter(a => a !== '#'), ', ');
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

  get arity(){ return this.args.length; }

  eq(expr){
    const stack = [[this, expr]];

    while(stack.length !== 0){
      const [e1, e2] = stack.pop();

      if(e1.name !== e2.name) return 0;

      e1.args.forEach((arg, i) => {
        stack.push([arg, e2.args[i]]);
      });
    }

    return 1;
  }

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

class IdentifierInfo extends Base{
  constructor(name, arity, isVar=0, constraints=null){
    super();

    this.name = name;
    this.arity = arity;
    this.isVar = isVar;
    this.constraints = constraints;
  }

  toStr(){
    const arr = [
      this.inc, this.name, ':',
      '\narity: ', String(this.arity),
      '\ntype: ', this.isVar ? 'variable' : 'constant',
    ];

    if(this.constraints !== null){
      const constraints = O.keys(this.constraints).filter(a => a !== '#');

      if(constraints.length !== 0){
        arr.push('\nconstraints: {');
        this.join(arr, constraints, ', ');
        arr.push('}');
      }
    }

    arr.push(this.dec);

    return arr;
  }
}

module.exports = {
  Base,
  Program,
  Mode,
  ModeSolve,
  ModeProve,
  Equation,
  Rule,
  VariableDefinition,
  Expression,
};