'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../../..');
const cs = require('.');

const {Base} = cs;

class FunctionDefinition extends Base{
  scope = new cs.Scope();
  func = null;
  arg = null;

  constructor(lhs, rhs){
    super();

    this.lhs = lhs;
    this.rhs = rhs;
  }

  toStr(){
    return [this.lhs, ' = ', this.rhs, ';'];
  }
}

const ctors = {
  FunctionDefinition,
};

Object.assign(cs, ctors);
module.exports = cs;