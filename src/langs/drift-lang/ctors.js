'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');

class Base{
  *getSyms(mode, syms=new Set()){ O.virtual('getSyms'); }

  *getTypes(syms=new Set()){ return O.tco([this, 'getSyms'], 0, syms); }
  *getVars(syms=new Set()){ return O.tco([this, 'getSyms'], 1, syms); }
}

class Program extends Base{
  idents = O.obj();
  types = O.obj();
  funcs = O.obj();

  constructor(errHandler){
    super();
    this.errHandler = errHandler;
  }

  sanitize(){
    const allTypeSyms = O.keys(this.types);
    const allFuncSyms = O.keys(this.funcs);

    for(const funcSym of allFuncSyms){
      const func = this.getFunc(funcSym);
      const funcType = func.type;

      const checkSym = sym => {
        this.assertHasSym(sym, funcSym);
      };

      for(const fcase of func.cases){
        const {lhs, rhs} = fcase;

        for(const sym of O.rec([fcase, 'getTypes']))
          checkSym(sym);

        const lhsVars = O.rec([lhs, 'getVars']);
        const rhsVars = O.rec([rhs, 'getVars']);

        for(const sym of rhsVars)
          if(!lhsVars.has(sym))
            checkSym(sym);
      }
    }

    return this;
  }

  hasIdent(ident){
    return O.has(this.idents, ident);
  }

  addIdent(ident, sym){
    assert(!this.hasIdent(ident));
    this.idents[ident] = sym;
  }

  ident2sym(ident){
    assert(this.hasIdent(ident));
    return this.idents[ident];
  }

  hasType(sym){
    return O.has(this.types, sym);
  }

  hasFunc(sym){
    return O.has(this.funcs, sym);
  }

  hasSym(sym){
    return this.hasType(sym) || this.hasFunc(sym);
  }

  addType(sym){
    assert(!this.hasSym(sym));
    this.addIdent(sym.description, sym);
    this.types[sym] = 1;
  }

  addFunc(sym, func){
    assert(!this.hasSym(sym));
    this.addIdent(sym.description, sym);
    this.funcs[sym] = func;
  }

  getFunc(sym){
    assert(this.hasFunc(sym));
    return this.funcs[sym];
  }

  addCase(sym, fcase){
    this.getFunc(sym).addCase(fcase);
  }

  getCases(sym){
    return this.getFunc(sym).cases;
  }

  casesNum(sym){
    return this.getCases(sym).length;
  }

  hasCases(sym){
    return this.casesNum(sym) !== 0;
  }

  assertHasSym(sym, func=null){
    if(!this.hasSym(sym))
      this.errNoSym(sym, func);
  }

  errNoSym(sym, func=null){
    this.err(`Undefined identifier ${O.sf(sym.description)}`, func);
  }

  err(msg, func=null){
    if(func !== null)
      msg = `${msg} in function ${O.sf(func.description)}`;
    
    this.errHandler(msg);
  }
}

class Function extends Base{
  constructor(sym, type=null, cases=[]){
    super();
    this.sym = sym;
    this.type = type;
    this.cases = cases;
  }

  get arity(){
    const {cases} = this;
    assert(cases.length !== 0);
    return cases[0].arity;
  }

  addCase(fcase){
    this.cases.push(fcase);
  }

  *getSyms(mode, syms=new Set()){
    for(const fcase of this.cases)
      yield [[fcase, 'getSyms'], mode, syms];

    return syms;
  }
}

class FunctionCase extends Base{
  constructor(lhs, rhs){
    super();
    this.lhs = lhs;
    this.rhs = rhs;
  }

  get arity(){
    return this.lhs.arity;
  }

  *getSyms(mode, syms=new Set()){
    yield [[this.lhs, 'getSyms'], mode, syms];
    yield [[this.rhs, 'getSyms'], mode, syms];

    return syms;
  }
}

class Lhs extends Base{
  constructor(args){
    super();
    this.args = args;
  }

  get arity(){ return this.args.length; }

  *getSyms(mode, syms=new Set()){
    for(const arg of this.args)
      yield [[arg, 'getSyms'], mode, syms];

    return syms;
  }
}

class Rhs extends Base{
  constructor(expr){
    super();
    this.expr = expr;
  }

  get result(){ return this.expr; }

  *getSyms(mode, syms=new Set()){
    return O.tco([this.expr, 'getSyms'], mode, syms);
  }
}

class Expression extends Base{}

class AnyExpression extends Expression{
  static #kCtor = Symbol();
  static anyExpr = new AnyExpression(this.#kCtor);

  constructor(kCtor){
    super();
    assert(kCtor === this.constructor.#kCtor);
  }

  *getSyms(mode, syms=new Set()){ return syms; }
}

class NamedExpression extends Expression{
  constructor(sym){
    super();
    assert(typeof sym === 'symbol');
    this.sym = sym;
  }
}

class Type extends NamedExpression{
  *getSyms(mode, syms=new Set()){
    if(mode === 0) syms.add(this.sym);
    return syms;
  }
}

class Variable extends NamedExpression{
  *getSyms(mode, syms=new Set()){
    if(mode === 1) syms.add(this.sym);
    return syms;
  }
}

class BinaryExpression extends Expression{
  constructor(fst, snd){
    super();
    this.fst = fst;
    this.snd = snd;
  }

  *getSyms(mode, syms=new Set()){
    yield [[this.fst, 'getSyms'], mode, syms];
    yield [[this.snd, 'getSyms'], mode, syms];

    return syms;
  }
}

class Pair extends BinaryExpression{}
class Call extends BinaryExpression{}

class AsPattern extends Expression{
  constructor(exprs){
    super();
    this.exprs = exprs;
  }

  *getSyms(mode, syms=new Set()){
    for(const expr of this.exprs)
      yield [[expr, 'getSyms'], mode, syms];

    return syms;
  }
}

const {anyExpr} = AnyExpression;

module.exports = {
  Base,
  Program,
  Function,
  FunctionCase,
  Lhs,
  Rhs,
  Expression,
  AnyExpression,
  NamedExpression,
  Type,
  Variable,
  BinaryExpression,
  Pair,
  Call,
  AsPattern,

  anyExpr,
};