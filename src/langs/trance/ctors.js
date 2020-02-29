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

    const err = (func, msg) => {
      esolangs.err(`${msg} (in the definition of function ${O.sf(func.name)})\n\n${func}`);
    };

    // Add functions
    for(const func of funcsArr){
      const {name, args, argNames} = func;
      const argsNum = args.length;
      const argNamesObj = O.obj();

      const createObj = () => {
        const obj = O.obj();
        obj.max = 0n;
        return obj;
      };

      if(!(name in funcsObj))
        funcsObj[name] = createObj();

      if(!(argsNum in funcsObj[name]))
        funcsObj[name][argsNum] = O.obj();

      const mainObj = funcsObj[name][argsNum];
      let obj = mainObj;

      const addEntry = (arg, val, any) => {
        const error = () => {
          err(func, `Argument ${O.sf(arg)} makes the overloaded function ambiguous`);
        };

        const hasAny = '*' in obj;
        let s;

        if(any){
          if(hasAny ? val !== obj.max : val < obj.max)
            error();

          obj.max = val;
          s = '*';
        }else{
          if(val >= obj.max){
            if(hasAny)
              error();

            obj.max = val + 1n;
          }

          s = String(val);
        }

        if(!(s in obj))
          obj[s] = createObj();

        obj = obj[s];
      };

      for(let i = 0; i !== argsNum; i++){
        const arg = args[i];
        const {elems} = arg;

        if(elems.length > 2)
          err(func, `${O.sf(arg)} is not a valid argument`);

        if(elems.length === 1 && elems[0].isInt){
          addEntry(arg, elems[0].val, 0);
          continue;
        }

        let [e1, e2=new Integer(0n)] = elems;

        if(e1.isInt && e2.isIdent)
          [e1, e2] = [e2, e1];

        if(!e1.isIdent)
          err(func, `Expected an identifier, but got ${
            O.sf(e1)} in argument ${O.sf(arg)}`);

        if(!e2.isInt)
          err(func, `Expected a literal integer, but got ${
            O.sf(e2)} in argument ${O.sf(arg)}`);

        const argName = e1.name;

        if(argName in argNamesObj)
          err(func, `Duplicated argument ${O.sf(argName)}`);

        argNamesObj[argName] = 1;
        argNames[i] = argName;
        addEntry(arg, e2.val, 1);
      }

      if('#' in obj)
        esolangs.err(`Ambiguous function definition\n\n${func}`);

      obj['#'] = func.expr;
    }

    // Sanitize function arguments
    for(const name in funcsObj){
      const mainObj = funcsObj[name];

      for(const argsNumStr in mainObj){
        const argsNum = argsNumStr | 0;
        if(argsNum === 0) continue;

        const err = path => {
          while(path.length !== argsNum)
            path.push(0n);

          esolangs.err(`Missing definition for\n\n${name}(${path.join(', ')})`);
        };

        const queue = [[mainObj[argsNum], []]];

        while(queue.length !== 0){
          const [obj, path] = queue.shift();
          const {max} = obj;
          const last = path.length === argsNum - 1;

          for(let i = 0n; i !== max; i++){
            if(!(i in obj)) err([...path, i]);
            if(!last) queue.push([obj[i], [...path, i]]);
          }

          if(!('*' in obj)) err([...path, obj.max]);
          if(!last) queue.push([obj['*'], [...path, obj.max]]);
        }
      }
    }

    // BigInt.prototype.toJSON = {a(){return String(this)}}.a;
    // log(O.sf(funcsObj));
  }

  toStr(){
    return this.join([], this.funcsArr, '\n\n');
  }
}

class Function extends Base{
  argNames = O.obj();

  constructor(name, args, expr){
    super();

    this.name = name;
    this.args = args;
    this.expr = expr;
  }

  toStr(){
    const arr = [this.name];

    if(this.args.length !== 0){
      arr.push('(');
      this.join(arr, this.args, ', ');
      arr.push(')');
    }

    arr.push(': ', this.expr);

    return arr;
  }
}

class Expression extends Base{
  get isSum(){ return 0; }
  get isCall(){ return 0; }
  get isIdent(){ return 0; }
  get isInt(){ return 0; }
}

class Sum extends Expression{
  constructor(elems){
    super();

    this.elems = elems;
  }

  get isSum(){ return 1; }

  toStr(){
    return this.join([], this.elems, ' + ');
  }
}

class Call extends Expression{
  constructor(ident, args){
    super();

    this.ident = ident;
    this.args = args;
  }

  get isCall(){ return 1; }

  toStr(){
    const arr = [this.ident];

    if(this.args.length !== 0){
      arr.push('(');
      this.join(arr, this.args, ', ');
      arr.push(')');
    }

    return arr;
  }
}

class Ident extends Expression{
  constructor(name){
    super();

    this.name = name;
  }

  get isIdent(){ return 1; }

  toStr(){
    return this.name;
  }
}

class Integer extends Expression{
  constructor(val){
    super();

    this.val = val;
  }

  get isInt(){ return 1; }

  toStr(){
    return String(this.val);
  }
}


module.exports = {
  Base,
  Program,
  Function,
  Expression,
  Sum,
  Call,
  Ident,
  Integer,
};