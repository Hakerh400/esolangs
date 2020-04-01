'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

class Base extends O.Stringifiable{}

class Program extends Base{
  constructor(funcsArr){
    super();

    this.funcsArr = funcsArr;
    const funcsObj = this.funcsObj = O.obj();

    // Add functions
    // Sanitize function formal arguments
    for(const func of funcsArr){
      const {name, args} = func;
      const argsNum = args.length;

      if(!(name in funcsObj))
        funcsObj[name] = O.obj();

      const obj = funcsObj[name];

      if(argsNum in obj)
        esolangs.err(`Redefinition of function ${
          name}\n\n${obj[name]}\n\n${func}`);

      obj[argsNum] = func;
    }

    // Sanitize function expressions
    for(const func of funcsArr){
      func.expr.bottomUp(expr => {
        if(expr.isIdent){
          const {name} = expr;

          if(!(name in func.argNames)){
            if(!(name in funcsObj && 0 in funcsObj[name]))
              func.err(`Undefined identifier ${O.sf(name)}`);

            expr.markedAsCall = 1;
            return;
          }

          expr.argIndex = func.argNames[name];
          return;
        }

        if(expr.isVector){
          const {arr} = expr;

          for(let i = 0; i !== arr.length; i++){
            const e = arr[i];

            if(e.isIdent && e.markedAsCall){
              const {name} = e;
              const call = new Call(name);

              call.funcRef = funcsObj[name][0];
              arr[i] = call;
            }
          }

          if(expr.isCall){
            const argsNum = expr.args.length;
            const funcName = expr.func;

            if(!(funcName in funcsObj && argsNum in funcsObj[funcName]))
              func.err(`Missing definition for function ${
                O.sf(funcName)} that takes ${O.gnum('argument', argsNum)}`);

            expr.funcRef = funcsObj[funcName][argsNum];
            return;
          }

          return;
        }

        if(expr.isUnary){
          const e = expr.expr;

          if(e.isIdent && e.markedAsCall){
            const {name} = e;
            const call = new Call(name);

            call.funcRef = funcsObj[name][0];
            expr.expr = call;
          }

          return;
        }

        assert.fail();
      });

      const e = func.expr;

      if(e.isIdent && e.markedAsCall){
        const {name} = e;
        const call = new Call(name);

        call.funcRef = funcsObj[name][0];
        func.expr = call;
      }
    }
  }

  toStr(){
    return this.join([], this.funcsArr, '\n\n');
  }
}

class FunctionDefinition extends Base{
  constructor(name, args, expr){
    super();

    this.name = name;
    this.args = args;
    this.expr = expr;

    const argNames = this.argNames = O.obj();

    args.forEach((arg, index) => {
      if(arg in argNames)
        this.err(`Duplicated argument ${O.sf(arg)}`);

      argNames[arg] = index;
    });
  }

  err(msg){
    esolangs.err(`${msg} (in the definition of function ${O.sf(this.name)})\n\n${this}`);
  }

  toStr(){
    const arr = [this.name];

    arr.push('(');
    this.join(arr, this.args, ', ');
    arr.push(')');
    arr.push(': ', this.expr);

    return arr;
  }
}

class Expression extends Base{
  reducing = 0;
  reducedNum = 0;

  get isVector(){ return 0; }
  get isSet(){ return 0; }
  get isCall(){ return 0; }
  get isUnary(){ return 0; }
  get isArg(){ return 0; }
  get isInvert(){ return 0; }
  get isIdent(){ return 0; }
  get isUnion(){ return 0; }

  get reduced(){ O.virtual('reduced'); }

  subst(args){
    const mainArr = [];
    const unaryExprs = [];
    const stack = [[[this], mainArr]];

    while(stack.length !== 0){
      const [arr1, arr2] = O.last(stack);
      const index = arr2.length;

      if(index === arr1.length){
        stack.pop();
        continue;
      }

      const expr = arr1[index];

      if(expr.isIdent){
        assert(!expr.markedAsCall);
        assert(expr.argIndex !== null);

        const arg = args[expr.argIndex];
        assert(arg.isArg);

        arr2.push(args[expr.argIndex].expr);
        continue;
      }

      if(expr.len !== 0)
        assert(!expr.reduced);

      if(expr.isCall){
        const arr = [];
        const call = new Call(expr.func, arr);

        call.funcRef = expr.funcRef;
        arr2.push(call);
        stack.push([expr.arr, arr]);

        continue;
      }

      if(expr.isSet){
        const arr = [];
        const set = new Set(arr);

        arr2.push(set);
        stack.push([expr.arr, arr]);

        continue;
      }

      if(expr.isArg){
        const arr = [];
        const arg = new Argument();

        arg.spreadNum = expr.spreadNum;
        arr2.push(arg);
        unaryExprs.push([arg, arr]);
        stack.push([[expr.expr], arr]);

        continue;
      }

      if(expr.isInvert){
        const arr = [];
        const invert = new Invert();

        arr2.push(invert);
        unaryExprs.push([invert, arr]);
        stack.push([[expr.expr], arr]);

        continue;
      }

      assert.fail();
    }

    for(const [expr1, [expr2]] of unaryExprs)
      expr1.expr = expr2;

    return mainArr[0];
  }
}

class VectorExpression extends Expression{
  constructor(arr=[]){
    super();

    this.arr = arr;
  }

  get isVector(){ return 1; }
  get len(){ return this.arr.length; }
  get reduced(){ return this.reducedNum === this.arr.length; }

  get chNum(){ return this.arr.length; }
  getCh(i){ return this.arr[i]; }
}

class Set extends VectorExpression{
  static SET_EMPTY = Set.reducedFromElems();
  static SET_SINGLETON = Set.reducedFromElems([this.SET_EMPTY]);

  static reducedFromElems(elems){
    return new Set(elems).reduce();
  }

  sorted = 0;
  id = null;

  constructor(elems){
    super(elems);
  }

  get isSet(){ return 1; }
  get elems(){ return this.arr; }
  get isEmpty(){ return this.arr.length === 0; }
  get isNonEmpty(){ return this.arr.length !== 0; }

  reduce(){
    this.reducedNum = this.arr.length;
    return this.sort();
  }

  sort(){
    assert(this.reduced);
    assert(!this.sorted);

    const ids = O.obj();

    this.arr = this.arr.filter(elem => {
      assert(elem.reduced);
      assert(elem.sorted);

      const {id} = elem;
      assert(id !== null);

      if(id in ids) return 0;

      ids[id] = 1;
      return 1;
    });

    this.arr.sort(({id: id1}, {id: id2}) => {
      return id1 < id2 ? -1 : 1;
    });

    this.reducedNum = this.arr.length;
    this.id = `{${this.arr.join('')}}`;
    this.sorted = 1;

    return this;
  }

  eq(set){
    assert(set instanceof Set);
    assert(this.reduced && this.sorted);
    assert(set.reduced && set.sorted);

    const stack = [[this, set]];

    while(stack.length !== 0){
      const [set1, set2] = stack.pop();

      if(set1.len !== set2.len)
        return 0;

      set1.elems.forEach((elem, index) => {
        stack.push([elem, set2.elems[index]]);
      });
    }

    return 1;
  }

  toStr(){
    const arr = ['{'];
    this.join(arr, this.elems, ', ');
    arr.push('}');
    return arr;
  }
}

class Call extends VectorExpression{
  funcRef = null;

  constructor(func, args){
    super(args);

    this.func = func;
  }

  get isCall(){ return 1; }
  get args(){ return this.arr; }

  perform(){
    assert(this.reduced);
    assert(this.funcRef !== null);

    const {func, funcRef, args} = this;
    const spreadIndex = args.findIndex(arg => arg.spreadNum !== 0);

    if(spreadIndex === -1)
      return funcRef.expr.subst(args);

    const spreadNumNew = args[spreadIndex].spreadNum - 1;

    const union =  new Union(new Set(
      args[spreadIndex].expr.arr.map(elem => {
        const argsNew = args.slice();
        argsNew[spreadIndex] = new Argument(elem, spreadNumNew);

        const callNew = new Call(func, argsNew);
        callNew.funcRef = funcRef;

        return callNew;
      }),
    ));

    return union;
  }

  toStr(){
    const {args} = this;
    const arr = [this.func];

    if(args.length !== 0){
      arr.push('(');
      this.join(arr, args, ', ');
      arr.push(')');
    }

    return arr;
  }
}

class UnaryExpression extends Expression{
  constructor(expr=null){
    super();

    this.expr = expr;
  }

  get isUnary(){ return 1; }
  get reduced(){ return this.reducedNum === 1; }

  get chNum(){ return 1; }
  getCh(i){ return this.expr; }
}

class Argument extends UnaryExpression{
  constructor(expr, spreadNum=0){
    super(expr);

    this.spreadNum = spreadNum;
  }

  get isArg(){ return 1; }

  toStr(){
    return ['~'.repeat(this.spreadNum), this.expr];
  }
}

class Invert extends UnaryExpression{
  constructor(expr){
    super(expr);
  }

  get isInvert(){ return 1; }

  toStr(){
    return ['!', this.expr];
  }
}

class Union extends UnaryExpression{
  constructor(expr){
    super(expr);
  }

  get isUnion(){ return 1; }

  toStr(){
    return ['U', this.expr];
  }
}

class Identifier extends Expression{
  argIndex = null;
  markedAsCall = 0;

  constructor(name){
    super();

    this.name = name;
  }

  get isIdent(){ return 1; }

  get chNum(){ return 0; }

  toStr(){
    return this.name;
  }
}

module.exports = {
  Base,
  Program,
  FunctionDefinition,
  Expression,
  VectorExpression,
  Set,
  Call,
  UnaryExpression,
  Argument,
  Invert,
  Union,
  Identifier,
};