'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');
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
      // log(this.#func.toString());
      // O.logb();
      // log(func.toString());
      // O.logb();

      assert.fail();
    }

    this.#func = func;
  }

  getNewFunc(){ O.virtual('getNewFunc'); }

  set(func){
    let frame = this;

    while(frame.prev !== null && func.examinable){
      func = frame.getNewFunc(func);
      frame = frame.prev;
    }

    frame.func = func;

    return frame;
  }
}

class Global extends StackFrame{
  constructor(func){
    assert(func.nullary);
    super(null, func);
  }

  propagate(func){
    assert.fail();
  }
}

class CompositionTarget extends StackFrame{
  getNewFunc(func){
    const {prev} = this;

    const c = new cs.Composition(prev.func.explicitArity);
    c.push(func);

    for(const arg of prev.func.args)
      c.push(arg);

    return c;
  }
}

class CompositionArgument extends StackFrame{
  constructor(prev, func, index){
    super(prev, func);

    this.index = index;
  }

  getNewFunc(func){
    const {prev} = this;

    const c = new cs.Composition(prev.func.explicitArity);
    c.push(prev.func.target);

    prev.func.args.forEach((arg, index) => {
      if(index === this.index) c.push(func);
      else c.push(arg);
    });

    return c;
  }
}

module.exports = {
  StackFrame,
  Global,
  CompositionTarget,
  CompositionArgument,
};