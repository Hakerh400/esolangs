'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

class Base{}

class Expression extends Base{
  parent = null;
  sliced = null;

  get type(){ O.virtual('type'); }
  shallowSlice(){ O.virtual('shallowSlice'); }
  replace(expr1, expr2){ O.virtual('replace'); }
  toStr(){ O.virtual('toStr'); }

  iter(func){
    const stack = [this];

    while(stack.length !== 0){
      const expr = stack.pop();

      const result = func(expr);
      if(result === 0) continue;

      if(result instanceof Expression){
        stack.push(result);
        continue;
      }

      const {type} = expr;
      if(type === 1) stack.push(expr.expr);
      else if(type === 2) stack.push(expr.expr2, expr.expr1);
    }
  }

  slice(){
    const stack = [0, this];

    while(stack.length !== 0){
      const expr = stack.pop();
      const mode = stack.pop();
      const {type} = expr;

      if(type === 0){
        expr.sliced = new Identifier(expr.name);
        continue;
      }

      if(type === 3){
        expr.sliced = new NativeFunction(expr.id);
        continue;
      }

      if(mode === 0){
        stack.push(1, expr);

        if(type === 1){
          stack.push(0, expr.expr);
          continue;
        }

        if(type === 2){
          stack.push(0, expr.expr2, 0, expr.expr1);
          continue;
        }

        O.noimpl(expr.constructor.name);
      }

      if(type === 1){
        const exprNew = new Abstraction(expr.ident, expr.byRef, expr.expr.sliced);
        exprNew.params = expr.params.slice();
        expr.sliced = exprNew;
        continue;
      }

      if(type === 2){
        expr.sliced = new Invocation(expr.expr1.sliced, expr.expr2.sliced);
        continue;
      }

      O.noimpl(expr.constructor.name);
    }

    return this.sliced;
  }

  toString(){
    const stack = [this];
    let str = '';

    while(stack.length !== 0){
      const elem = stack.pop();

      if(typeof elem === 'string'){
        str += elem;
        continue;
      }

      const arr = elem.toStr();

      if(typeof arr === 'string'){
        str += arr;
        continue;
      }

      for(let i = arr.length - 1; i !== -1; i--)
        stack.push(arr[i]);
    }

    return str;
  }
}

class Identifier extends Expression{
  constructor(name){
    super();
    this.name = name;
  }

  get type(){ return 0; }

  shallowSlice(){
    return new Identifier(this.name);
  }

  toStr(){
    return this.name;
  }
}

class Abstraction extends Expression{
  params = [null, null, null];
  wasFancy = 0;

  constructor(ident, byRef, expr){
    super();
    this.ident = ident;
    this.byRef = byRef;
    this.expr = expr;

    expr.parent = this;
  }

  get type(){ return 1; }

  shallowSlice(){
    return new Abstraction(this.ident, this.byRef, this.expr);
  }

  replace(expr1, expr2){
    this.expr = expr2;
    return expr2.parent = this;
  }

  toStr(){
    const {params} = this;
    const arr = [];

    if(params[0] !== null) arr.push(`${params[0]}-`);
    arr.push(`${this.byRef ? '&' : ''}${this.ident}`);
    if(params[1] !== null) arr.push(`-${params[1]}`);

    arr.push('. ');
    arr.push(this.expr);

    return arr;
  }
}

class Invocation extends Expression{
  constructor(expr1, expr2){
    super();
    this.expr1 = expr1;
    this.expr2 = expr2;

    expr1.parent = this;
    expr2.parent = this;
  }

  get type(){ return 2; }

  shallowSlice(){
    return new Invocation(this.expr1, this.expr2);
  }

  replace(expr1, expr2){
    if(expr1 === this.expr1) this.expr1 = expr2;
    else this.expr2 = expr2;
    return expr2.parent = this;
  }

  toStr(){
    const {expr1, expr2} = this;
    const t1 = expr1.type;
    const t2 = expr2.type;

    const p1 = t1 === 1;
    const p2 = t2 === 1 || t2 === 2;

    const arr = [];

    if(p1) arr.push('(');
    arr.push(expr1);
    if(p1) arr.push(')');

    arr.push(' ');

    if(p2) arr.push('(');
    arr.push(expr2);
    if(p2) arr.push(')');

    return arr;
  }
}

class NativeFunction extends Expression{
  constructor(id){
    super();
    this.id = id;
  }

  get type(){ return 3; }

  shallowSlice(){
    return new NativeFunction(this.id);
  }

  toStr(){
    return `[${this.id}]`;
  }
}

class FancyFunction extends Expression{
  constructor(args, exprs){
    super();
    this.args = args;
    this.exprs = exprs;

    if(args.length === 0)
      args.push(new FancyArgument('#'));
  }

  get type(){ return 5; }

  shallowSlice(){
    return new FancyFunction(this.args, this.exprs);
  }
}

class FancyArgument extends Base{
  constructor(ident, byRef=0){
    super();
    this.ident = ident;
    this.byRef = byRef;
  }
}

class FancyCall extends Expression{
  constructor(func, args){
    super();
    this.func = func;
    this.args = args;

    if(args.length === 0)
      args.push(new Identifier('#0'));
  }

  get type(){ return 5; }

  shallowSlice(){
    return new FancyCall(this.func, this.args);
  }

  toStr(){
    const {args} = this;
    const arr = ['('];

    for(let i = 0; i !== args.length; i++){
      if(i !== 0) arr.push(', ');
      arr.push(args[i]);
    }

    arr.push(')');
    return arr;
  }
}

class VarDeclaration extends Expression{
  constructor(ident, expr){
    super();
    this.ident = ident;
    this.expr = expr;
  }

  get type(){ return 6; }

  shallowSlice(){
    return new VarDeclaration(this.ident, this.expr);
  }

  toStr(){
    return [this.ident, ' := ', this.expr];
  }
}

class Assignment extends Expression{
  constructor(ident, expr){
    super();
    this.ident = ident;
    this.expr = expr;
  }

  get type(){ return 7; }

  shallowSlice(){
    return new Assignment(this.ident, this.expr);
  }

  toStr(){
    return [this.ident, ' = ', this.expr];
  }
}

module.exports = {
  Base,
  Expression,
  Identifier,
  Abstraction,
  Invocation,
  NativeFunction,
  FancyFunction,
  FancyArgument,
  FancyCall,
  VarDeclaration,
  Assignment,
};