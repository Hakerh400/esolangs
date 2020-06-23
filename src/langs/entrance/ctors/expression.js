'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../../..');
const cs = require('.');

const {min, max} = Math;
const {Base} = cs;

const emptySet = new Set();

class Expression extends Base{
  static id = 0;
  id = Expression.id++;

  constructor(system, symbol, idents, identsOutsideCall, pairDepth, callDepth){
    super();

    this.system = system;
    this.symbol = symbol;
    this.idents = idents;
    this.identsOutsideCall = identsOutsideCall;
    this.pairDepth = pairDepth;
    this.callDepth = callDepth;

    this.pri = (
      idents.size +
      pairDepth / 5 +
      callDepth * 5
    );
  }

  get type(){ O.virtual('type'); }
  get tpri(){ O.virtual('tpri'); }

  instantiate(){
    if(this.idents.size === 0)
      return this;

    const {system} = this;
    const symbols = new Map();
    const exprs = new Map();

    this.bottomUp(expr => {
      switch(expr.type){
        case 0: break;

        case 1:
          const {fst, snd} = expr;

          const hasFst = fst.idents.size !== 0;
          const hasSnd = snd.idents.size !== 0;
          if(!(hasFst || hasSnd)) break;

          if(hasFst) assert(exprs.has(fst));
          if(hasSnd) assert(exprs.has(snd));

          exprs.set(expr, new Pair(
            system,
            hasFst ? exprs.get(fst) : fst,
            hasSnd ? exprs.get(snd) : snd,
          ));

          break;

        case 2:
          const sym = expr.symbol;

          if(!symbols.has(sym))
            symbols.set(sym, new Identifier(system, system.createSymbol()));

          exprs.set(expr, symbols.get(sym));

          break;

        case 3:
          const {func, arg} = expr;
          if(arg.idents.size === 0) break;

          exprs.set(expr, new Call(
            system,
            func,
            exprs.get(arg),
          ));

          break;

        default:
          assert.fail(expr.type);
          break;
      }
    });


    return exprs.get(this);
  }

  subst(identSym, exprNew){
    if(!this.idents.has(identSym))
      return this;

    const {system} = this;
    const map = new Map();

    this.bottomUp(expr => {
      switch(expr.type){
        case 0: break;

        case 1:
          const {fst, snd} = expr;

          const hasFst = fst.idents.has(identSym);
          const hasSnd = snd.idents.has(identSym);
          if(!(hasFst || hasSnd)) break;

          map.set(expr, new Pair(
            system,
            hasFst ? map.get(fst) : fst,
            hasSnd ? map.get(snd) : snd,
          ));

          break;

        case 2:
          const sym = expr.symbol;
          if(sym !== identSym) break;

          map.set(expr, exprNew);

          break;

        case 3:
          const {func, arg} = expr;
          if(!arg.idents.has(identSym)) break;

          map.set(expr, new Call(
            system,
            func,
            map.get(arg),
          ));

          break;

        default:
          assert.fail(expr.type);
          break;
      }
    });

    return map.get(this);
  }

  replaceCallsWithIdents(){
    const {system} = this;
    const map = new Map();

    this.bottomUp(expr => {
      switch(expr.type){
        case 0: case 2: break;

        case 1:
          const {fst, snd} = expr;

          const hasFst = map.has(fst);
          const hasSnd = map.has(snd);
          if(!(hasFst || hasSnd)) break;

          map.set(expr, new Pair(
            system,
            hasFst ? map.get(fst) : fst,
            hasSnd ? map.get(snd) : snd,
          ));

          break;

        case 3:
          map.set(expr, system.createIdent());
          break;

        default:
          assert.fail(expr.type);
          break;
      }
    });

    return map.get(this);
  }
}

class Constant extends Expression{
  constructor(system, symbol){
    super(system, symbol, emptySet, emptySet, 0, 0);
  }

  get type(){ return 0; }
  get tpri(){ return 0; }

  get chNum(){ return 0; }

  toStr(){
    return this.symbol;
  }
}

class Pair extends Expression{
  constructor(system, fst, snd){
    const idents = new Set([...fst.idents, ...snd.idents]);
    const identsOutsideCall = new Set([...fst.identsOutsideCall, ...snd.identsOutsideCall]);
    const pairDepth = max(fst.pairDepth, snd.pairDepth) + 1;
    const callDepth = max(fst.callDepth, snd.callDepth);
    super(system, null, idents, identsOutsideCall, pairDepth, callDepth);

    this.fst = fst;
    this.snd = snd;
  }

  get type(){ return 1; }
  get tpri(){ return 1; }

  get chNum(){ return 2; }
  getCh(i){ return i === 0 ? this.fst : this.snd; }

  toStr(){
    return ['(', this.fst, ', ', this.snd, ')'];
  }
}

class Identifier extends Expression{
  constructor(system, symbol){
    const identsOutsideCall = new Set([symbol]);
    super(system, symbol, identsOutsideCall, identsOutsideCall, 0, 0);
  }

  get type(){ return 2; }
  get tpri(){ return 3; }

  get chNum(){ return 0; }

  toStr(){
    return this.symbol;
  }
}

class Call extends Expression{
  constructor(system, func, arg){
    const symbol = system.createSymbol();
    super(system, symbol, arg.idents, emptySet, arg.pairDepth, arg.callDepth + 1);

    this.func = func;
    this.arg = arg;
  }

  get type(){ return 3; }
  get tpri(){ return 5; }

  get chNum(){ return 1; }
  getCh(){ return this.arg; }

  toStr(){
    return ['['+this.id+'] ',this.func, ' ', this.arg];
  }
}

const ctors = {
  Expression,
  Constant,
  Pair,
  Identifier,
  Call,
};

Object.assign(cs, ctors);
module.exports = cs;