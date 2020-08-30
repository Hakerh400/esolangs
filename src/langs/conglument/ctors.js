'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const arrOrder = require('../../common/arr-order');
const debug = require('../../common/debug');

const identChars = O.chars('a', 26);

class Base extends O.Stringifiable{}

class Function extends Base{
  get full(){ O.virtual('full'); }
  get arity(){ O.virtual('arity'); }
  get typeStr(){ O.virtual('typeStr'); }

  get nullary(){ return this.arity === 0; }
  get unary(){ return this.arity === 1; }
  get binary(){ return this.arity === 2; }

  push(){ O.virtual('push'); }

  get arityStr(){
    return `${this.arity} `;
  }

  minify(){
    let str = '';

    this.traverse((func, dir) => {
      if(dir === 0){
        const s = func.toString({min: 1});
        str += `(${s}`;
      }else{
        str += `)`;
      }
    });

    let num = 0;

    while(1){
      const strs = O.obj();
      const stack = [];

      let maxStr = null;

      for(const c of str){
        if(c === '('){
          stack.push(c);
          continue;
        }

        if(c === ')'){
          const s = stack.pop() + c;
          O.setLast(stack, O.last(stack) + s);

          if(s in strs){
            const cnt = ++strs[s];

            if(cnt >= 2)
              if(maxStr === null || s.length > maxStr.length)
                maxStr = s;
          }else{
            strs[s] = 1;
          }

          continue;
        }

        O.setLast(stack, O.last(stack) + c);
      }

      if(maxStr === null) break;

      const parts = str.split(maxStr);

      parts[1] = maxStr + parts[1];
      str = parts.join(`#${num++}`);
    }

    num = 0;

    while(1){
      const match = str.match(/#\d+/);
      if(match === null) break;

      const ident = arrOrder.str(identChars, ++num);
      str = str.split(match[0]).join(ident);
    }

    str = str.
      replace(/[\(\)]/g, '').
      replace(/.{100}/g, a => `${a}\n`).
      trim();

    return str;
  }

  toString(opts){
    assert(this.full);
    return super.toString(opts);
  }
}

class Functor extends Function{
  #arity;

  constructor(arity){
    super();

    assert(arity >= 0);

    this.#arity = arity;
  }

  get chNum(){ return 0; }

  get full(){ return 1; }
  get arity(){ return this.#arity; }

  push(func){ assert.fail(); }
}

class Empty extends Functor{
  constructor(arity){
    super(arity);
  }

  get typeStr(){ return '.'; }

  toStr(opts){
    return [!opts.min ? this.arityStr : '', this.typeStr, global.String(this.arity)];
  }
}

class Prefix extends Functor{
  constructor(bit){
    super(1);

    assert(bit === 0 || bit === 1);

    this.bit = bit;
  }

  get typeStr(){ return '+'; }

  toStr(opts){
    return [!opts.min ? this.arityStr : '', this.typeStr, global.String(this.bit)];
  }
}

class Projection extends Functor{
  constructor(arity, index){
    super(arity);

    assert(index >= 0);
    assert(index < arity);

    this.index = index;
  }

  get typeStr(){ return '%'; }

  toStr(opts){
    return [!opts.min ? this.arityStr : '', this.typeStr, global.String(this.arity), global.String(this.index)];
  }
}

class Combinator extends Function{
  #computedArity = null;

  hasComputedArity(){
    return this.#computedArity !== null;
  }

  getComputedArity(){
    return this.#computedArity;
  }

  setComputedArity(computedArity){
    return this.#computedArity = computedArity;
  }
}

class Composition extends Combinator{
  #arity = null;

  target = null;
  args = [];

  constructor(explicitArity){
    super();

    assert(explicitArity !== void 0);
    this.explicitArity = explicitArity;
  }

  get chNum(){
    assert(this.full);
    return this.args.length + 1;
  }

  getCh(i){
    assert(this.full);
    if(i === 0) return this.target;
    return this.args[i - 1];
  }

  get full(){
    return this.target !== null && this.args.length === this.target.arity;
  }

  get arity(){
    const {args} = this;

    assert(this.full);

    if(args.length === 0){
      assert(this.#arity !== null);
      return this.#arity;
    }

    if(this.hasComputedArity())
      return this.getComputedArity();

    const arity = args[0].arity;
    this.setComputedArity(arity);

    return arity;
  }

  set arity(arity){
    const {target, args} = this;

    assert(this.full);
    assert(target.nullary);
    assert(this.#arity === null);
    assert(arity !== null);

    this.#arity = arity;
  }

  get typeStr(){ return '~'; }

  push(func){
    assert(!this.full);
    assert(func.full);

    if(this.target === null){
      const {explicitArity} = this;
      const {arity} = func;

      this.target = func;

      if(func.nullary){
        if(explicitArity === null)
          this.err(`A composition whose first argument is a nullary function must have an explicit arity`);

        this.arity = explicitArity;
      }else{
        if(explicitArity !== null)
          this.err(`A composition whose explicit arity is ${
            explicitArity} must take a nullary function as the first argument, but it takes a function that has ${
            O.gnum('argument', func.arity)}`);
      }

      return;
    }

    const {args} = this;

    if(args.length === 0){
      args.push(func);
      return;
    }

    if(func.arity !== args[0].arity)
      this.err(`All arguments of a composition (except the first) must have the same arity (expected: ${
        args[0].arity}, got: ${func.arity})`);

    args.push(func);
  }

  err(msg){
    log(msg);
    log();
    assert.fail();

    // esolangs.err(msg);
  }

  toStr(opts){
    const {explicitArity} = this;

    if(opts.min) return `${this.typeStr}${explicitArity !== null ? explicitArity : ''}`;

    const s = explicitArity !== null ? ` [${this.explicitArity}]` : '';
    const arr = [!opts.min ? this.arityStr : '', this.typeStr, s, this.inc, '\n'];
    this.join(arr, [this.target, ...this.args], '\n');
    arr.push(this.dec);
    return arr;
  }
}

class Recursion extends Combinator{
  empty = null;
  zero = null;
  one = null;

  get chNum(){
    assert(this.full);
    return 3;
  }

  getCh(i){
    assert(this.full);
    if(i === 0) return this.empty;
    if(i === 1) return this.zero;
    return this.one;
  }

  get full(){
    return this.one !== null;
  }

  get arity(){
    assert(this.full);

    if(this.hasComputedArity())
      return this.getComputedArity();

    const arity = this.empty.arity + 1;
    this.setComputedArity(arity);
    
    return arity;
  }

  get typeStr(){ return '-'; }

  push(func){
    assert(!this.full);
    assert(func.full);

    if(this.empty === null){
      this.empty = func;
      return;
    }

    if(func.arity !== this.empty.arity + 2)
      esolangs.err(`The arity of the second and the third argument of a recursion${
        ''} must be by 2 larger than the arity of the first argument (arities: [${[
        this.empty, this.zero, this.one, func,
      ].filter(a => a !== null).map(a => a.arity).join(', ')}])`);

    if(this.zero === null){
      this.zero = func;
      return;
    }

    this.one = func;
  }

  toStr(opts){
    if(opts.min) return this.typeStr;

    const arr = [!opts.min ? this.arityStr : '', this.typeStr, this.inc, '\n'];
    this.join(arr, [this.empty, this.zero, this.one], '\n');
    arr.push(this.dec);

    return arr;
  }
}

class Minimization extends Combinator{
  func = null;

  constructor(strs=['']){
    super();

    this.strs = strs;
  }

  get chNum(){
    assert(this.full);
    return 1;
  }

  getCh(i){
    assert(this.full);
    return this.func;
  }

  get full(){
    return this.func !== null;
  }

  get arity(){
    assert(this.full);

    if(this.hasComputedArity())
      return this.getComputedArity();

    const arity = this.func.arity - 1;
    this.setComputedArity(arity);
    
    return arity;
  }

  get typeStr(){ return '*'; }

  push(func){
    assert(!this.full);
    assert(func.full);
    assert(!func.nullary);

    this.func = func;
  }

  get commonBit(){
    const {strs} = this;
    assert(strs.length !== 0);

    let bit = null;

    for(const str of this.strs){
      if(str.length === 0) return null;

      const b = str[0] | 0;

      if(bit === null){
        bit = b;
        continue;
      }

      if(b !== bit) return null;
    }

    return bit;
  }

  woutBit(){
    const {strs} = this;
    assert(strs.length !== 0);

    const strsNew = strs.map(str => {
      assert(str.length !== 0);
      return str.slice(1);
    });

    const m = new Minimization(strsNew);
    m.push(this.func);

    return m;
  }

  accept(){
    const {strs, func} = this;
    assert(strs.length !== 0);

    const str = strs[0];
    const strsNew = strs.slice(1);

    strsNew.push(`${str}0`, `${str}1`);

    const m = new Minimization(strsNew);
    m.push(this.func);

    return m;
  }

  reject(){
    const {strs, func} = this;
    assert(strs.length !== 0);

    const str = strs[0];
    const strsNew = strs.slice(1);

    const m = new Minimization(strsNew);
    m.push(this.func);

    return m;
  }

  toStr(opts){
    if(opts.min) return this.typeStr;

    const s = ` [${this.strs.map(s => {
      if(s === '') return '/';
      return s;
    }).join(', ')}]`;

    const arr = [!opts.min ? this.arityStr : '', this.typeStr, s, this.inc, '\n'];

    this.join(arr, [this.func], '\n');
    arr.push(this.dec);

    return arr;
  }
}

class String extends Function{
  #arity;

  constructor(str, arity=0){
    super();

    this.str = str;
    this.#arity = arity;
  }

  get full(){ return 1; }
  get arity(){ return this.#arity; }

  push(func){ assert.fail(); }

  toStr(opts){
    assert(!opts.min);
    return [this.arityStr, '"', this.str, '"'];
  }
}

module.exports = {
  Base,
  Function,
  Functor,
  Empty,
  Prefix,
  Projection,
  Combinator,
  Composition,
  Recursion,
  Minimization,
  String,
};