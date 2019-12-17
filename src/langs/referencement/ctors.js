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
  replace(expr1, expr2){ O.virtual('replace'); }
  toStr(){ O.virtual('toStr'); }

  iter(func){
    const stack = [this];

    while(stack.length !== 0){
      const expr = stack.pop();
      const {type} = expr;

      if(func(expr) === 0) continue;

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
        if(type === 1) stack.push(0, expr.expr);
        else if(type === 2) stack.push(0, expr.expr2, 0, expr.expr1);
        if(mode === 0) continue;
      }

      if(type === 1){
        const exprNew = new Abstraction(expr.ident, expr.byRef, expr.expr.sliced);
        exprNew.x = expr.x;
        exprNew.y = expr.y;
        expr.sliced = exprNew;
        continue;
      }

      expr.sliced = new Invocation(expr.expr1.sliced, expr.expr2.sliced);
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

  toStr(){
    return this.name;
  }
}

class Abstraction extends Expression{
  x = null;
  y = null;

  constructor(ident, byRef, expr){
    super();
    this.ident = ident;
    this.byRef = byRef;
    this.expr = expr;

    expr.parent = this;
  }

  get type(){ return 1; }

  replace(expr1, expr2){
    this.expr = expr2;
    return expr2.parent = this;
  }

  toStr(){
    const arr = [];

    if(this.x !== null) arr.push(`${this.x}-`);
    arr.push(this.ident);
    if(this.y !== null) arr.push(`-${this.y}`);

    arr.push(`${this.byRef ? ':' : '.'} `);
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

  toStr(){
    return O.sfcc(this.id + 65);
  }
}

module.exports = {
  Base,
  Expression,
  Identifier,
  Abstraction,
  Invocation,
  NativeFunction,
};