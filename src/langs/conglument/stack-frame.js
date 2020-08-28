'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

class StackFrame{
  constructor(func, next){
    this.func = func;
    this.next = next;
  }

  set(){ O.virtual('set'); }
}

class Global extends StackFrame{
  constructor(func){
    super(func, null);
  }

  set(func){
    this.func = func;
    return this;
  }
}

class Target extends StackFrame{
  set(func){
    const {next} = this;

    const c = new cs.Composition();
    c.push(func);

    for(const arg of next.func.args)
      c.push(args);

    next.func = c;
    return next;
  }
}

module.exports = {
  StackFrame,
  Global,
  Target,
};