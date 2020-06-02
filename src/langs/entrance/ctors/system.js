'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../../..');
const cs = require('.');

const {Base} = cs;

class System extends Base{
  #constsScope = new cs.Scope();
  #funcsScope = new cs.Scope();
  #generatedSymbolsScope = new cs.Scope();
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
          map.set(tempStruct, new cs.Call(this, this.getFunc(data[0]), map.get(data[1])));
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

const ctors = {
  System,
};

Object.assign(cs, ctors);
module.exports = cs;