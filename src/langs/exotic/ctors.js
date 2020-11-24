'use strict';

const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

const types = O.enum([
  'DNF', 'SYSTEM',
  'EQ', 'NEQ',
  'TERM', 'PAIR', 'IDENT', 'CALL',
]);

const {
  DNF, SYSTEM,
  EQ, NEQ,
  TERM, PAIR, IDENT, CALL,
} = types;

class Base extends O.Stringifiable{
  err(msg){
    esolangs.err(`${msg}\n\n${this}`);
  }
}

class Program extends Base{
  constructor(rules){
    super();

    // Sanitize rules
    {
      const rulesNum = rules.length;

      // Create rule hierarchy
      {
        const subsMap = new Map();

        for(const rule of rules)
          subsMap.set(rule, new Set());

        for(let i = 0; i !== rulesNum; i++){
          const rule1 = rules[i];

          for(let j = i + 1; j !== rulesNum; j++){
            const rule2 = rules[j];
            const relation = rule1.cmp(rule2);

            if(rule1.eq(rule2))
              esolangs.err(`Duplicate rules\n\n${
                rule1}\n${rule2}`);

            if(relation === -1){
              subsMap.get(rule1).add(rule2);
              continue;
            }

            if(relation === 1){
              subsMap.get(rule2).add(rule1);
              continue;
            }
          }
        }

        for(const rule of rules){
          const subs = subsMap.get(rule);

          subsLoop: for(const sub1 of subs){
            for(const sub2 of subs)
              if(subsMap.get(sub2).has(sub1))
                continue subsLoop;

            rule.addSub(sub1);
          }
        }
      }

      // Ensure that each rule can be executed
      for(const rule of rules){
        const {subs} = rule;

        const id = solver.newIdent();
        const ident = [IDENT, id];
        const eqs = [[EQ, ident, rule.lhsArr]];

        for(const sub of subs)
          eqs.push([NEQ, ident, sub.lhsArr]);

        const dnf = [DNF, [[SYSTEM, eqs]]];
        const sol = O.rec(solver.solve, dnf);

        if(sol === null){
          assert(subs.size >= 2);

          esolangs.err(`The following rule\n\n${
            rule}\n\nis shadowed by rules\n\n${
            [...subs].join('\n')}`);
        }
      }

      // Ensure that rules cover all values
      {
        const id = solver.newIdent();
        const ident = [IDENT, id];
        const eqs = [];

        for(const rule of rules)
          eqs.push([NEQ, ident, rule.lhsArr]);

        const dnf = [DNF, [[SYSTEM, eqs]]];
        const sol = O.rec(solver.solve, dnf);

        if(sol !== null)
          esolangs.err(`The following expression\n\n${
            O.rec(solver.arr2str, sol[id])}\n\nis not covered by any rule`);
      }
    }

    this.rules = rules.filter(rule => rule.isBase);
  }

  get chNum(){ return this.rules.length; }
  getCh(i){ return this.rules[i]; }

  toStr(){
    return this.join([], this.rules, '\n');
  }
}

class Rule extends Base{
  subs = new Set();
  isBase = 1;

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

    this.lhsArr = O.rec([lhs, 'toArr']);
    this.rhsArr = O.rec([rhs, 'toArr']);
  }

  sup(other){ return O.rec([this.lhs, 'sup'], other.lhs); }
  sub(other){ return O.rec([this.lhs, 'sub'], other.lhs); }
  cmp(other){ return O.rec([this.lhs, 'cmp'], other.lhs); }
  eq(other){ return O.rec([this.lhs, 'eq'], other.lhs); }
  neq(other){ return O.rec([this.lhs, 'neq'], other.lhs); }

  hasSub(sub){
    return this.subs.has(sub);
  }

  addSub(sub){
    this.subs.add(sub);
    sub.isBase = 0;
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

  static fromBinStr(binStr){
    return binStr.toExpr();
  }

  get type(){ O.virtual('type'); }

  *getIdents(){ O.virtual('getIdents'); }
  *toArr(){ O.virtual('toArr'); }
  *sup(other){ O.virtual('sup'); }
  *eq(other){ O.virtual('eq'); }

  *sub(other){
    return yield [[other, 'sup'], this];
  }

  *cmp(other){
    if(yield [[this, 'sup'], other]) return -1;
    if(yield [[this, 'sub'], other]) return 1;
    return 0;
  }

  *neq(other){
    return !(yield [[this, 'eq'], other]);
  }

  toBin(){
    return BinStr.fromExpr(this);
  }
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

  get type(){ return TERM; }

  *getIdents(idents=O.obj()){
    return idents;
  }

  *toArr(){
    return [TERM];
  }

  *sup(other){
    return other.type === TERM;
  }

  *eq(other){
    return other.type === TERM;
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

  get type(){ return PAIR; }

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

  *sup(other){
    return (
      other.type === PAIR &&
      (yield [[this.fst, 'sup'], other.fst]) &&
      (yield [[this.snd, 'sup'], other.snd])
    );
  }

  *eq(other){
    return (
      other.type === PAIR &&
      (yield [[this.fst, 'eq'], other.fst]) &&
      (yield [[this.snd, 'eq'], other.snd])
    );
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

  get type(){ return IDENT; }

  *getIdents(idents=O.obj()){
    const {name} = this;

    if(!(name in idents)) idents[name] = 1;
    else idents[name]++;

    return idents;
  };

  *toArr(){
    return [IDENT, this.name];
  }

  *sup(other){
    return 1;
  }

  *eq(other){
    return other.type === IDENT;
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

  get type(){ return CALL; }

  *getIdents(idents=O.obj()){
    yield [[this.target, 'getIdents'], idents];
    return idents;
  };

  *toArr(){
    return [CALL, yield [[this.target, 'toArr']]];
  }

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

const solver = require('./solver');
const BinStr = require('./bin-str');