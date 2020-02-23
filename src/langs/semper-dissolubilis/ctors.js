'use strict';

const fs = require('fs');
const path = require('path');
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

      if(!(name in funcsObj))
        funcsObj[name] = [];

      funcsObj[name].push(func);
    }
  }

  toStr(){
    return this.join([], this.funcsArr, '\n');
  }
}

class Function extends Base{
  constructor(expr1, expr2){
    super();

    this.name = expr1.ident;
    this.expr1 = expr1;
    this.expr2 = expr2;

    if(expr2.paramsArr.length !== 0)
      esolangs.err(`Parameter ${
        O.sf(expr2.paramsArr[0])} cannot be defined on the RHS:\n\n${
        this}`);
  }

  toStr(){
    return [this.expr1, ': ', this.expr2];
  }
}

class Expression extends Base{
  paramsArr = [];
  paramsObj = O.obj();
  isParam = 0;
  reduced = 0;

  constructor(ident, args=[]){
    super();

    if(ident.startsWith('&')){
      this.isParam = 1;
      ident = ident.slice(1);
    }

    this.ident = ident;
    this.args = [];

    if(this.isParam){
      if(args.length !== 0)
        esolangs.err(`Parameter ${
          O.sf(ident)} cannot be invoked as a function. Relevant context:\n\n${
          this}`);

      this.addParam(ident);
    }else{
      this.addArgs(args);
    }
  }

  addArgs(args){
    for(const arg of args)
      this.addArg(arg);
  }

  addArg(arg){
    this.args.push(arg);
    this.addParams(arg.paramsArr);
  }

  addParams(paramsArr){
    for(const param of paramsArr)
      this.addParam(param);
  }

  addParam(param){
    const {paramsArr, paramsObj} = this;

    if(param in paramsObj)
      esolangs.err(`Duplicated parameter ${
        O.sf(param)} is not allowed. Relevant context:\n\n${
        this}`);

    paramsArr.push(param);
    paramsObj[param] = paramsArr.length - 1;
  }

  substitute(paramsObj){
    const mainArr = [];
    const stack = [[[this], mainArr]];

    while(stack.length !== 0){
      const [args1, args2] = O.last(stack);
      const index = args2.length;

      if(index === args1.length){
        stack.pop();
        continue;
      }

      const expr = args1[index];
      const {ident, args} = expr;

      if(args.length === 0 && ident in paramsObj){
        args2.push(paramsObj[ident]);
        continue;
      }

      const exprNew = new Expression(ident);

      args2.push(exprNew);
      stack.push([args, exprNew.args]);
    }

    return mainArr[0];
  }

  toStr(){
    const arr = [];

    if(this.isParam)
      arr.push('&');

    arr.push(this.ident);

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
  Function,
  Expression,
};