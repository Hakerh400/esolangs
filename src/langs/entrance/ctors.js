'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const arrOrder = require('../../common/arr-order');

const {min, max} = Math;

const GENERATED_IDENTS_PREFIX = '';

const identChars = O.chars('A', 26);

const emptySet = new Set();

class Base extends O.Stringifiable{}

class System extends Base{
  #constsScope = new Scope();
  #funcsScope = new Scope();

  constructor(funcDefs){
    super();

    for(const funcDef of funcDefs){
      const {scope} = funcDef;
      const lhs = this.constructExpr(scope, funcDef.lhs);
      const rhs = this.constructExpr(scope, funcDef.rhs);

      funcDef.lhs = lhs;
      funcDef.rhs = rhs;
      funcDef.func = lhs.func;
      funcDef.arg = lhs.arg;
    }

    this.funcDefs = funcDefs;
  }

  constructExpr(identsScope, tempStruct){
    const constsScope = this.#constsScope;
    const funcsScope = this.#funcsScope;

    const map = new Map();

    tempStruct.bottomUp(tempStruct => {
      const {type, data} = tempStruct;

      switch(type){
        case 'const':
          map.set(tempStruct, new Constant(constsScope.nameToSymbol(data)));
          break;

        case 'pair':
          map.set(tempStruct, new Pair(map.get(data[0]), map.get(data[1])));
          break;

        case 'ident':
          map.set(tempStruct, new Identifier(identsScope.nameToSymbol(data)));
          break;

        case 'call':
          map.set(tempStruct, new Call(funcsScope.nameToSymbol(data[0]), map.get(data[1])));
          break;

        default: assert.fail(type); break;
      }
    });

    return map.get(tempStruct);
  }

  toStr(){
    return this.join([], this.funcDefs, '\n');
  }
}

class Scope extends Base{
  #names = O.obj();
  #symbols = new Set();
  #unnamedSymbols = new Set();
  #nameIndex = 0;

  nameToSymbol(name){
    if(name in this.#names)
      return this.#names[name];

    const sym = new UniqueSymbol(this, name);
    this.#names[name] = sym;
    this.#symbols.add(sym);

    return sym;
  }

  createSymbol(){
    const sym = new UniqueSymbol(this);
    this.#unnamedSymbols.add(sym);
    return sym;
  }

  generateName(sym){
    assert(this.#unnamedSymbols.has(sym));
    this.#unnamedSymbols.delete(sym);

    const name = sym.name = `${
      GENERATED_IDENTS_PREFIX}${
      arrOrder.str(identChars, ++this.#nameIndex)}`;

    this.#names[name] = sym;
    this.#symbols.add(sym);

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
      case 'const': case 'ident': break;

      case 'pair':
        arr.push(data[0], data[1]);
        break;

      case 'call':
        arr.push(data[1]);
        break;

      default: assert.fail(type); break;
    }

    this.arr = arr;
  }

  get chNum(){ return this.arr.length; }
  getCh(i){ return this.arr[i]; }
}

class Expression extends Base{
  constructor(idents, funcs, pairDepth, callDepth){
    super();

    this.idents = idents;
    this.funcs = funcs;
    this.pairDepth = pairDepth;
    this.callDepth = callDepth;
  }

  get type(){ O.virtual('type'); }
}

class Constant extends Expression{
  constructor(symbol){
    super(emptySet, emptySet, 0, 0);

    this.symbol = symbol;
  }

  get type(){ return 'const'; }

  toStr(){
    return this.symbol;
  }
}

class Pair extends Expression{
  constructor(fst, snd){
    const idents = new Set([...fst.idents, ...snd.idents]);
    const funcs = new Set([...fst.funcs, ...snd.funcs]);
    const pairDepth = max(fst.pairDepth, snd.pairDepth) + 1;
    const callDepth = max(fst.callDepth, snd.callDepth);
    super(idents, funcs, pairDepth, callDepth);

    this.fst = fst;
    this.snd = snd;
  }

  get type(){ return 'pair'; }

  toStr(){
    return ['(', this.fst, ', ', this.snd, ')'];
  }
}

class Identifier extends Expression{
  constructor(symbol){
    super(emptySet, new Set([symbol]), 0, 0);

    this.symbol = symbol;
  }

  get type(){ return 'ident'; }

  toStr(){
    return this.symbol;
  }
}

class Call extends Expression{
  constructor(func, arg){
    const funcs = arg.funcs.has(func) ? arg.funcs : new Set([...arg.funcs, func]);
    super(arg.idents, funcs, arg.pairDepth, arg.callDepth + 1);

    this.func = func;
    this.arg = arg;
  }

  get type(){ return 'call'; }

  toStr(){
    return [this.func, ' ', this.arg];
  }
}

module.exports = {
  Base,
  System,
  FunctionDefinition,
  TemporaryStructure,
  Function,
  Expression,
  Constant,
  Pair,
  Identifier,
  Call,
};