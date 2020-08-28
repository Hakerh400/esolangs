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

  get full(){
    return 1;
  }

  get arity(){
    return this.#arity;
  }

  push(func){
    assert.fail();
  }
}

class Empty extends Functor{
  constructor(arity){
    super(arity);
  }

  toStr(){
    return ['.', String(this.arity)];
  }
}

class Successor extends Functor{
  constructor(bit){
    super(1);

    assert(bit === 0 || bit === 1);

    this.bit = bit;
  }

  toStr(){
    return ['+', String(this.bit)];
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
    return ['%', String(this.arity), '|', String(this.index)];
  }
}

class Combinator extends Function{}

class Composition extends Combinator{
  target = null;
  args = [];

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
      if(func.arity === 0)
        esolangs.err(`The first argument of a composition cannot be a nullary function`);

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

module.exports = {
  Base,
  Function,
  Functor,
  Empty,
  Successor,
  Projection,
  Combinator,
  Composition,
};