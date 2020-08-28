'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

class Base extends O.Stringifiable{}

class Function extends Base{
  get full(){ O.virtual('full'); }
  get arity(){ O.virtual('arity'); }

  get nullary(){ return this.arity === 0; }
  get unary(){ return this.arity === 1; }
  get binary(){ return this.arity === 2; }

  push(){ O.virtual('push'); }

  toString(){
    assert(this.full);
    return super.toString();
  }
}

class Functor extends Function{
  #arity;

  constructor(arity){
    super();

    assert(arity >= 0);

    this.#arity = arity;
  }

  get full(){ return 1; }
  get arity(){ return this.#arity; }

  push(func){ assert.fail(); }
}

class Empty extends Functor{
  constructor(arity){
    super(arity);
  }

  toStr(){
    return ['.', global.String(this.arity)];
  }
}

class Prefix extends Functor{
  constructor(bit){
    super(1);

    assert(bit === 0 || bit === 1);

    this.bit = bit;
  }

  toStr(){
    return ['+', global.String(this.bit)];
  }
}

class Projection extends Functor{
  constructor(arity, index){
    super(arity);

    assert(index >= 0);
    assert(index < arity);

    this.index = index;
  }

  toStr(){
    return ['%', global.String(this.arity), '|', global.String(this.index)];
  }
}

class Combinator extends Function{}

class Composition extends Combinator{
  target = null;
  args = [];

  constructor(main=0){
    super();

    this.main = main;
  }

  get full(){
    return this.target !== null && this.args.length === this.target.arity;
  }

  get arity(){
    assert(this.full);
    assert(this.args.length !== 0);
    return this.args[0].arity;
  }

  push(func){
    assert(!this.full);
    assert(func.full);

    if(this.target === null){
      if(func.nullary){
        if(this.main)
          esolangs.err(`The main function must be unary`);

        esolangs.err(`The first argument of a composition cannot be a nullary function`);
      }

      this.target = func;
      return;
    }

    const {args} = this;

    if(args.length === 0){
      args.push(func);
      return;
    }

    if(func.arity !== args[0].arity)
      esolangs.err(`All arguments of a composition (except the first) must have the same arity`);

    args.push(func);
  }

  toStr(){
    const arr = ['~', this.inc, '\n'];
    this.join(arr, [this.target, ...this.args], '\n');
    arr.push(this.dec);
    return arr;
  }
}

class Recursion extends Combinator{
  empty = null;
  zero = null;
  one = null;

  get full(){
    return this.one !== null;
  }

  get arity(){
    assert(this.full);
    return this.empty.arity + 1;
  }

  push(func){
    assert(!this.full);
    assert(func.full);

    if(this.empty === null){
      this.empty = func;
      return;
    }

    if(func.arity !== this.empty.arity + 2)
      esolangs.err(`The arity of the second and the third argument of a recursion must be by 2 larger than the arity of the first argument`);

    if(this.zero === null){
      this.zero = func;
      return;
    }

    this.one = func;
  }

  toStr(){
    const arr = ['-', this.inc, '\n'];
    this.join(arr, [this.empty, this.zero, this.one], '\n');
    arr.push(this.dec);
    return arr;
  }
}

class Minimization extends Combinator{
  func = null;

  get full(){
    return this.func !== null;
  }

  get arity(){
    assert(this.full);
    return this.func.arity + 1;
  }

  push(func){
    assert(!this.full);
    assert(func.full);

    this.func = func;
  }

  toStr(){
    const arr = ['*', this.inc, '\n'];
    this.join(arr, [this.func], '\n');
    arr.push(this.dec);
    return arr;
  }
}

class String extends Function{
  constructor(str){
    super();

    this.str = str;
  }

  get full(){ return 1; }
  get arity(){ return 0; }

  push(func){ assert.fail(); }

  toStr(){
    return ['"', this.str, '"'];
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