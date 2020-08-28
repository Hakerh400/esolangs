'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

class StackFrame{
  #func = null;

  constructor(next, func){
    this.next = next;
    this.func = func;
  }

  get func(){
    return this.#func;
  }

  set func(func){
    assert(func.full);
    this.#func = func;
  }

  set(){ O.virtual('set'); }
}

class Global extends StackFrame{
  constructor(func){
    super(null, func);
  }

  set(func){
    this.func = func;
    return this;
  }
}

class CompositionArgument extends StackFrame{
  constructor(next, func, index){
    super(next, func);

    this.index = index;
  }

  set(func){
    const {next} = this;

    const c = new cs.Composition();
    c.push(next.func.target);

    next.func.args.forEach((arg, index) => {
      if(index === this.index) c.push(func);
      else c.push(arg);
    });

    return next.set(c);
  }
}

module.exports = {
  StackFrame,
  Global,
  CompositionArgument,
};