'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../../..');
const cs = require('.');

const {Base} = cs;

class Binding extends Base{
  constructor(prev, symbol, expr){
    super();

    this.prev = prev;
    this.symbol = symbol;
    this.expr = expr;
  }

  toStr(){
    return [this.symbol, ': ', this.expr];
  }
}

const ctors = {
  Binding,
};

Object.assign(cs, ctors);
module.exports = cs;