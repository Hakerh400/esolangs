'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../../..');
const arrOrder = require('../../../common/arr-order');
const cs = require('.');

const {Base} = cs;

const GENERATED_IDENTS_PREFIX = '';

const identChars = O.chars('A', 26);

const genSymName = index => {
  return `${
    GENERATED_IDENTS_PREFIX}${
    arrOrder.str(identChars, index + 1n)}`;
};

class System extends Base{
  #constsScope = new Scope();
  #funcsScope = new Scope();
  #generatedSymbolsScope = new Scope();
  #funcsInfo = new Map();

  constructor(funcDefs){
    super();

    const funcsInfo = this.#funcsInfo;

    for(const funcDef of funcDefs){
      const {scope} = funcDef;
      const lhs = this.constructExpr(funcDef.lhs, scope);
      const rhs = this.constructExpr(funcDef.rhs, scope);

      funcDef.lhs = lhs;
      funcDef.rhs = rhs;
      funcDef.func = lhs.func;
      funcDef.arg = lhs.arg;

      const funcSym = lhs.func;

      if(!funcsInfo.has(funcSym))
        funcsInfo.set(funcSym, []);

      const funcInfo = funcsInfo.get(funcSym);
      funcInfo.push(new cs.Pair(this, lhs.arg, rhs));
    }

    this.funcDefs = funcDefs;
  }

  constructExpr(tempStruct, identsScope=null){
    const map = new Map();

    tempStruct.bottomUp(tempStruct => {
      const {type, data} = tempStruct;

      switch(type){
        case 0:
          map.set(tempStruct, new cs.Constant(this, this.getConst(data)));
          break;

        case 1:
          map.set(tempStruct, new cs.Pair(this, map.get(data[0]), map.get(data[1])));
          break;

        case 2:
          assert(identsScope !== null);
          map.set(tempStruct, new cs.Identifier(this, identsScope.nameToSymbol(data)));
          break;

        case 3:
          map.set(tempStruct, new cs.Call(this, this.createSymbol(), this.getFunc(data[0]), map.get(data[1])));
          break;

        default: assert.fail(type); break;
      }
    });

    return map.get(tempStruct);
  }

  getConst(name){
    return this.#constsScope.nameToSymbol(name);
  }

  getFunc(name){
    return this.#funcsScope.nameToSymbol(name);
  }

  createSymbol(){
    return this.#generatedSymbolsScope.createSymbol();
  }

  getFuncInfo(funcSym){
    const funcsInfo = this.#funcsInfo;

    if(!funcsInfo.has(funcSym))
      return [];

    return funcsInfo.get(funcSym);
  }

  toStr(){
    return this.join([], this.funcDefs, '\n');
  }
}

class Scope extends Base{
  #symbols = O.obj();
  #nameIndex = 0n;

  nameToSymbol(name){
    if(name in this.#symbols)
      return this.#symbols[name];

    const sym = new UniqueSymbol(this, name);
    this.#symbols[name] = sym;

    return sym;
  }

  createSymbol(){
    return new UniqueSymbol(this);
  }

  generateName(sym){
    const name = sym.name = genSymName(this.#nameIndex++);
    assert(!(name in this.#symbols));

    this.#symbols[name] = sym;

    return name;
  }
}

class UniqueSymbol extends Base{
  #name = null;

  constructor(scope, name=null){
    super();

    this.scope = scope;
    this.#name = name;
  }

  get name(){
    if(this.#name !== null)
      return this.#name;

    return this.#name = this.scope.generateName(this);
  }

  set name(name){
    assert(this.#name === null);
    this.#name = name;
  }

  toStr(){
    return this.name;
  }
}

class FunctionDefinition extends Base{
  scope = new Scope();
  func = null;
  arg = null;

  constructor(lhs, rhs){
    super();

    this.lhs = lhs;
    this.rhs = rhs;
  }

  toStr(){
    return [this.lhs, ' = ', this.rhs, ';'];
  }
}

class TemporaryStructure extends Base{
  constructor(type, data){
    super();

    this.type = type;
    this.data = data;

    const arr = [];

    switch(type){
      case 0: case 2: break;

      case 1:
        arr.push(data[0], data[1]);
        break;

      case 3:
        arr.push(data[1]);
        break;

      default: assert.fail(type); break;
    }

    this.arr = arr;
  }

  get chNum(){ return this.arr.length; }
  getCh(i){ return this.arr[i]; }
}

const ctors = {
  System,
  Scope,
  UniqueSymbol,
  FunctionDefinition,
  TemporaryStructure,
};

Object.assign(cs, ctors);
module.exports = cs;