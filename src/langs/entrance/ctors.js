'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

const SHOW_IDENT_INFO = 0;

class Base extends O.Stringifiable{}

class Program extends Base{
  constructor(mode){
    super();

    this.mode = mode;
  }

  toStr(){
    return this.mode;
  }
}

class Mode extends Base{
  get name(){ return O.virtual('name'); }
}

class ModeSolve extends Mode{
  constructor(vars, eqs){
    super();

    this.vars = vars;
    this.eqs = eqs;

    const identSet = this.identSet = new IdentifierSet(this);

    identSet.extractInfoArr(eqs);
    identSet.sanitize(vars);
  }

  get name(){ return 'solve'; }

  get chNum(){ return this.eqs.length; }
  getCh(i){ return this.eqs[i]; }

  toStr(){
    const arr = ['# ', this.name, this.identSet];

    if(this.vars.length !== 0){
      arr.push('\n\n[');
      this.join(arr, this.vars, ', ');
      arr.push(']');
    }

    if(this.eqs.length !== 0){
      arr.push('\n\n');
      this.join(arr, this.eqs, '\n');
    }

    return arr;
  }
}

class ModeProve extends Mode{
  constructor(rules, target){
    super();

    this.rules = rules;
    this.target = target;

    const identSet = this.identSet = new IdentifierSet(this);

    identSet.extractInfo(this.target);
    identSet.concat(this.rules.map(a => a.identSet));
  }

  get name(){ return 'prove'; }

  get chNum(){ return this.rules.length; }
  getCh(i){ return this.rules[i]; }

  toStr(){
    const arr = ['# ', this.name, this.identSet];

    if(this.rules.length !== 0){
      arr.push('\n\n');
      this.join(arr, this.rules, '\n');
    }

    arr.push('\n\n', this.target);

    return arr;
  }
}

class IdentifierSet extends Base{
  #info = O.obj();
  #identsNum = 0;

  constructor(ctx){
    super();

    this.ctx = ctx;
  }

  get identsNum(){ return this.#identsNum; }
  get identsArr(){ return Object.values(this.#info); }
  has(name){ return name in this.#info; }
  get(name){ return this.#info[name]; }

  concat(arr){
    const {ctx} = this;

    for(const identSet of arr){
      for(const info of identSet){
        const {name} = info;


        if(!this.has(name)){
          this.add(name, info);
          continue;
        }

        if(!info.eq(this.get(name)))
          esolangs.err(`Identifier ${
            O.sf(name)} has inconsistent definitions\n\n${
            ctx}`);
      }
    }

    return this;
  }

  add(name, info){
    if(name in this.#info){
      const infoCur = this.#info[name];

      if(info.arity !== infoCur.arity)
        esolangs.err(`Arity mismatch for identifier ${O.sf(name)}`);

      return this;
    }

    this.#info[name] = info;
    this.#identsNum++;
  }

  extractInfo(elem){
    elem.topDown(elem => {
      if(!(elem instanceof Expression)) return;

      const info = new IdentifierInfo(elem.name, elem.arity);
      this.add(elem.name, info);
    });
  }

  extractInfoArr(arr){
    for(const elem of arr)
      this.extractInfo(elem);
  }

  sanitize(vars){
    const {ctx} = this;

    for(const varDef of vars){
      const {name, constraints} = varDef;

      if(!this.has(name)){
        this.add(name, new IdentifierInfo(name, 0, 1));
        continue;
      }

      const info = this.get(name);

      if(info.isVar === 1)
        esolangs.err(`Redefinition of variable ${O.sf(name)}\n\n${
        ctx}`);

      info.isVar = 1;
      info.constraints = constraints;
    }

    for(const varDef of vars){
      const {name, constraints} = varDef;

      for(const constraint in constraints){
        if(constraint === '#') continue;

        if(!this.has(constraint)){
          // delete constraints[constraint];
          // constraints['#']--;
          continue;
        }

        const info = this.get(constraint);

        if(info.isVar)
          esolangs.err(`Constraint ${
            O.sf(constraint)} for variable ${
            O.sf(name)} must be a constant\n\n${
            ctx}`);

        if(info.arity !== 0)
          esolangs.err(`Constraint ${
            O.sf(constraint)} for variable ${
            O.sf(name)} must have arity 0\n\n${
            ctx}`);
      }
    }
  }

  toStr(){
    const arr = [];

    if(SHOW_IDENT_INFO && this.identsNum !== 0){
      arr.push('\n', this.prefixPush, '// ', '\n');
      this.join(arr, this.identsArr, '\n\n');
      arr.push(this.prefixPop);
    }

    return arr;
  }

  *[Symbol.iterator](){
    yield* this.identsArr;
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

  eq(info){
    if(!(
      this.name === info.name &&
      this.arity === info.arity &&
      (this.isVar ^ info.isVar) === 0
    )) return 0;

    const cs1 = this.constraints;
    const cs2 = info.constraints;

    if(cs1 === null || cs2 === null)
      return cs1 === cs2;

    for(const key in cs1)
      if(!(key in cs2))
        return 0;

    for(const key in cs2)
      if(!(key in cs1))
        return 0;

    return 1;
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

class InferenceRule extends Base{
  constructor(name, vars, premises, conclusion){
    super();

    this.name = name;
    this.vars = vars;
    this.premises = premises;
    this.conclusion = conclusion;

    const identSet = this.identSet = new IdentifierSet(this);

    identSet.extractInfoArr(premises);
    identSet.extractInfoArr(conclusion);
    identSet.sanitize(vars);
  }

  toStr(){
    const arr = [];

    if(this.name !== null)
      arr.push(this.name, ': ');

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
  static any = new Expression('*');

  static arg(i){
    return new Expression(i, [], 1);
  }

  constructor(name, args=[], isArg=0){
    super();

    this.name = name;
    this.args = args;
    this.isArg = isArg;
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

  substVars(varsObj){
    const map = new Map();

    this.bottomUp(expr => {
      const {name} = expr;
      const args = expr.args.map(a => map.get(a));

      if(!(name in varsObj)){
        map.set(expr, new Expression(name, args));
        return;
      }

      map.set(expr, varsObj[name].substArgs(args));
    });

    return map.get(this);
  }

  substArgs(sArgs){
    const map = new Map();

    this.bottomUp(expr => {
      const {name} = expr;

      if(!expr.isArg){
        const args = expr.args.map(a => map.get(a));
        map.set(expr, new Expression(name, args));
        return;
      }

      map.set(expr, sArgs[name]);
    });

    return map.get(this);
  }

  toStr(){
    const arr = [String(this.name)];

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
  Program,
  Mode,
  ModeSolve,
  ModeProve,
  IdentifierSet,
  IdentifierInfo,
  Equation,
  InferenceRule,
  VariableDefinition,
  Expression,
};