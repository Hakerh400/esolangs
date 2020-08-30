'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

class StackFrame{
  #func = null;

  constructor(prev, func){
    this.prev = prev;
    this.func = func;
  }

  get func(){
    return this.#func;
  }

  set func(func){
    assert(func.full);

    if(this.#func !== null && func.arity !== this.func.arity){
      log(this.#func.toString());
      O.logb();
      log(func.toString());
      O.logb();

      assert.fail();
    }

    this.#func = func;
  }

  set(){ O.virtual('set'); }
}

class Global extends StackFrame{
  constructor(func){
    assert(func.nullary);
    super(null, func);
  }

  set(func){
    this.func = func;
    return this;
  }
}

class CompositionArgument extends StackFrame{
  constructor(prev, func, index){
    super(prev, func);

    this.index = index;
  }

  set(func){
    const {prev} = this;

    const c = new cs.Composition(prev.func.explicitArity);
    c.push(prev.func.target);

    prev.func.args.forEach((arg, index) => {
      if(index === this.index) c.push(func);
      else c.push(arg);
    });

    return prev.set(c);
  }
}

class CompositionTarget extends StackFrame{
  set(func){
    const {prev} = this;

    const c = new cs.Composition(prev.func.explicitArity);
    c.push(func);

    for(const arg of prev.func.args)
      c.push(arg);

    return prev.set(c);
  }
}

module.exports = {
  StackFrame,
  Global,
  CompositionArgument,
  CompositionTarget,
};