'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

const keywords = O.arr2obj([
  'void',
  'bool',
  'int',
  'if',
  'else',
  'for',
  'while',
  'return',
]);

class Base extends O.Stringifiable{}

class Program extends Base{
  constructor(funcsArr){
    super();

    this.funcsArr = funcsArr;
    const funcsObj = this.funcsObj = O.obj();

    for(const func of funcsArr){
      const {name} = func;

      if(name in funcsObj)
        esolangs.err(`Redefinition of function ${
          O.sf(name)}:\n\n${
          funcsObj[name]}\n\n${
          func}`);

      funcsObj[name] = func;
    }
  }

  toStr(){
    return this.join([], this.funcsArr, '\n\n');
  }
}

class FunctionDefinition extends Base{
  constructor(type, name, args, body){
    super();

    this.type = type;
    this.name = name;
    this.args = args;
    this.body = body;
  }

  toStr(){
    const arr = [this.type, ' ', this.name, '('];
    this.join(arr, this.args, ', ');
    arr.push(this.inc, ')', this.body);
    return arr;
  }
}

class FormalArgument extends Base{
  constructor(type, name){
    super();

    this.type = type;
    this.name = name;
  }

  toStr(){
    return [this.type, ' ', this.name];
  }
}

class FunctionBody extends Base{
  constructor(stats){
    super();

    this.stats = stats;
  }

  toStr(){
    if(this.stats.length === 0)
      return '{}';

    const arr = [this.inc, '{\n'];
    this.join(arr, this.stats, '\n');
    arr.push(this.dec, '\n}');
    return arr;
  }
}

class Type extends Base{
  constructor(name, ptrs){
    super();

    this.name = name;
    this.ptrs = ptrs;

    if(ptrs !== 0){
      if(name !== 'int')
        esolangs.err(`Type ${
          O.sf(this)} is invalid, because only integers can have pointers`);
    }
  }

  toStr(){
    return [this.name, '*'.repeat(this.ptrs)];
  }
}

class Expression extends Base{}

class Identifier extends Expression{
  constructor(name){
    super();

    if(name in keywords)
      esolangs.err(`${O.sf(name)} is a reserved keyword`);

    this.name = name;
  }

  toStr(){
    return this.name;
  }
}

module.exports = {
  Base,
  Program,
  FunctionDefinition,
  FormalArgument,
  FunctionBody,
  Type,
  Expression,
  Identifier,
};