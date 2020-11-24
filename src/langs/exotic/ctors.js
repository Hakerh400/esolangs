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

const int2bin = int => {
  return O.rev((int + 1n).toString(2).slice(1));
};

const bin2int = bin => {
  return BigInt(`0b1${O.rev(bin)}`) - 1n;
};

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

            if(rule1.eq(rule2))
              esolangs.err(`Duplicate rules\n\n${
                rule1}\n${rule2}`);

            const relation = rule1.cmp(rule2);

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

      // Ensure that no rule is shadowed by other rules
      for(const rule of rules){
        const {subs} = rule;

        const id = solver.newIdent();
        const ident = [IDENT, id];
        const eqs = [[EQ, ident, rule.lhsArr]];

        for(const sub of subs)
          eqs.push([NEQ, ident, sub.lhsArr]);

        const dnf = [DNF, [[SYSTEM, eqs]]];
        const sol = O.rec(solver.solve, dnf, {[id]: 1});

        if(sol === null){
          assert(subs.size >= 2);

          esolangs.err(`The following rule\n\n${
            rule}\n\nis shadowed by rules\n\n${
            [...subs].join('\n')}`);
        }
      }

      // Ensure that rules cover all expressions
      {
        const id = solver.newIdent();
        const ident = [IDENT, id];
        const eqs = [];

        for(const rule of rules)
          eqs.push([NEQ, ident, rule.lhsArr]);

        const dnf = [DNF, [[SYSTEM, eqs]]];
        const sol = O.rec(solver.solve, dnf, {[id]: 1});

        if(sol !== null)
          esolangs.err(`The following expression\n\n${
            O.rec(solver.arr2str, sol[id])}\n\nis not covered by any rule`);
      }
    }

    const finalRules = new Set();

    for(const rule of rules)
      if(rule.isBase)
        finalRules.add(rule);

    this.rules = finalRules;
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

  apply(expr){
    assert(expr.reduced);

    const idents = O.rec([this.lhs, 'match'], expr);
    const result = O.rec([this.rhs, 'subst'], idents);

    return result;
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

  static fromBin(bin){
    return Expression.fromInt(bin2int(bin));
  }

  static fromInt(int){
    if(int === 0n)
      return Term.term;

    int--;

    const mainPair = new Pair();
    const stack = [mainPair];

    while(stack.length !== 0){
      const pair = O.last(stack);
      const index = pair.fst === null ? 0 : 1;
      if(index === 1) stack.pop();

      const last = stack.length === 0;
      let expr;

      calcExpr: {
        if(last){
          if(int === 0n){
            expr = Term.term;
            break calcExpr;
          }

          int--;
          expr = new Pair();

          break calcExpr;
        }

        expr = int & 1n ? new Pair() : Term.term;
        int >>= 1n;
      }

      if(expr.type === PAIR)
        stack.push(expr);

      if(index === 0) pair.fst = expr;
      else pair.snd = expr;
    }

    return mainPair;
  }

  get type(){ O.virtual('type'); }
  get reduced(){ O.virtual('reduced'); }

  *getIdents(){ O.virtual('getIdents'); }
  *toArr(){ O.virtual('toArr'); }
  *sup(){ O.virtual('sup'); }
  *eq(){ O.virtual('eq'); }

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
    return int2bin(this.toInt());
  }

  toInt(){
    const stack = [this];
    const ops = [];

    while(stack.length !== 0){
      const expr = stack.pop();
      const {type} = expr;
      const last = stack.length === 0;

      assert(type === TERM || type === PAIR);

      if(type === PAIR)
        stack.push(expr.snd, expr.fst);

      updateInt: {
        if(last){
          if(type === TERM)
            break updateInt;

          ops.push(2);
          break updateInt;
        }

        ops.push(type === TERM ? 0 : 1);
      };
    }

    let int = 0n;

    for(let i = ops.length - 1; i !== -1; i--){
      const op = ops[i];

      if(op === 2) int++;
      else int = (int << 1n) | (op ? 1n : 0n);
    }

    return int;
  }

  *match(){ O.virtual('match'); }
  *subst(){ O.virtual('match'); }
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
  get reduced(){ return 1; }

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

  *match(expr, idents=O.obj()){
    assert(expr.type === TERM);
    return idents;
  }

  *subst(idents){
    return this;
  }

  get chNum(){ return 0; }

  toStr(){
    return '.';
  }
}

class Pair extends Expression{
  #reduced;

  constructor(fst=null, snd=null){
    super();

    this.fst = fst;
    this.snd = snd;

    this.#reduced = fst && snd ?
      fst.reduced & snd.reduced : 1;
  }

  get type(){ return PAIR; }
  get reduced(){ return this.#reduced; }

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

  *match(expr, idents=O.obj()){
    assert(expr.type === PAIR);
    yield [[this.fst, 'match'], expr.fst, idents];
    yield [[this.snd, 'match'], expr.snd, idents];
    return idents;
  }

  *subst(idents){
    return new Pair(
      yield [[this.fst, 'subst'], idents],
      yield [[this.snd, 'subst'], idents],
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
  get reduced(){ return 1; }
  
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

  *match(expr, idents=O.obj()){
    idents[this.name] = expr;
    return idents;
  }

  *subst(idents){
    return idents[this.name];
  }

  get chNum(){ return 0; }

  toStr(){
    return String(this.name);
  }
}

class Call extends Expression{
  constructor(target=null){
    super();

    this.target = target;
  }

  get type(){ return CALL; }
  get reduced(){ return 0; }

  *getIdents(idents=O.obj()){
    yield [[this.target, 'getIdents'], idents];
    return idents;
  };

  *toArr(){
    return [CALL, yield [[this.target, 'toArr']]];
  }

  *subst(idents){
    return new Call(
      yield [[this.target, 'subst'], idents],
    );
  }

  get chNum(){ return 1; }
  getCh(i){ return this.target; }

  toStr(){
    return ['*', this.target];
  }
}

module.exports = {
  types,

  int2bin,
  bin2int,

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