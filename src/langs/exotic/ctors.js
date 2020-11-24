'use strict';

const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

const types = O.enum([
  'DNF', 'SYSTEM',
  'EQ', 'NEQ',
  'TERM', 'PAIR', 'IDENT',
]);

const {
  DNF, SYSTEM,
  EQ, NEQ,
  TERM, PAIR, IDENT,
} = types;

class Base extends O.Stringifiable{
  err(msg){
    esolangs.err(`${msg}\n\n${this}`);
  }
}

class Program extends Base{
  constructor(rules){
    super();

    this.rules = rules;
  }

  get chNum(){ return this.rules.length; }
  getCh(i){ return this.rules[i]; }

  toStr(){
    return this.join([], this.rules, '\n');
  }
}

class Rule extends Base{
  constructor(lhs, rhs){
    super();

    this.lhs = lhs;
    this.rhs = rhs;

    const lhsIdents = O.rec([lhs, 'getIdents']);
    const rhsIdents = O.rec([rhs, 'getIdents']);

    for(const name in lhsIdents)
      if(lhsIdents[name] !== 1)
        this.err(`Duplicate parameters are not allowed`);

    for(const name in rhsIdents)
      if(!(name in lhsIdents))
        this.err(`Undefined identifier ${O.sf(name)}`);
  }

  get chNum(){ return 2; }
  getCh(i){ return i === 0 ? this.lhs : this.rhs; }

  toStr(){
    return [this.lhs, ' ', this.rhs];
  }
}

class Expression extends Base{
  static *fromArr(arr){
    const type = arr[0];

    switch(type){
      case TERM:
        return Term.term;
        break;

      case PAIR:
        return new Pair(
          yield [Expression.fromArr, arr[1]],
          yield [Expression.fromArr, arr[2]],
        );
        break;

      case IDENT:
        return new Identifier(arr[1]);
        break;

      default:
        assert.fail(type);
        break;
    }
  }

  *getIdents(){ O.virtual('getIdents'); }
  *toArr(){ O.virtual('toArr'); }
}

class Term extends Expression{
  static #kCtor = Symbol('ctor');
  static #term = null;

  static get term(){
    if(this.#term === null)
      this.#term = new Term(Term.#kCtor);

    return this.#term;
  }

  constructor(kCtor){
    super();
    assert(kCtor === Term.#kCtor);
  }

  *getIdents(idents=O.obj()){
    return idents;
  }

  *toArr(){
    return [TERM];
  }

  get chNum(){ return 0; }

  toStr(){
    return '.';
  }
}

class Pair extends Expression{
  constructor(fst, snd){
    super();

    this.fst = fst;
    this.snd = snd;
  }

  *getIdents(idents=O.obj()){
    yield [[this.fst, 'getIdents'], idents];
    yield [[this.snd, 'getIdents'], idents];
    return idents;
  }

  *toArr(){
    return [PAIR,
      yield [[this.fst, 'toArr']],
      yield [[this.snd, 'toArr']],
    ];
  }

  get chNum(){ return 2; }
  getCh(i){ return i === 0 ? this.fst : this.snd; }

  toStr(){
    return ['(', this.fst, ' ', this.snd, ')'];
  }
}

class Identifier extends Expression{
  constructor(name){
    super();

    this.name = name;
  }

  *getIdents(idents=O.obj()){
    const {name} = this;

    if(!(name in idents)) idents[name] = 1;
    else idents[name]++;

    return idents;
  };

  *toArr(){
    return [IDENT, this.name];
  }

  get chNum(){ return 0; }

  toStr(){
    return String(this.name);
  }
}

class Call extends Expression{
  constructor(target){
    super();

    this.target = target;
  }

  *getIdents(idents=O.obj()){
    yield [[this.target, 'getIdents'], idents];
    return idents;
  };

  get chNum(){ return 1; }
  getCh(i){ return this.target; }

  toStr(){
    return ['*', this.target];
  }
}

module.exports = {
  types,

  Base,
  Program,
  Rule,
  Expression,
  Term,
  Pair,
  Identifier,
  Call,
};