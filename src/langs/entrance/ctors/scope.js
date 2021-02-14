'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../../..');
const arrOrder = require('../../../common/arr-order');
const cs = require('.');

const {Base} = cs;

const identChars = O.chars('A', 26);

log('SCOPE')

class Scope extends Base{
  #symbols = O.obj();
  #nameIndex = 0n;

  static genSymName(index){
    return `${
      cs.GENERATED_IDENTS_PREFIX}${
      arrOrder.str(identChars, index + 1n)}`;
  };

  nameToSymbol(name){
    if(name in this.#symbols)
      return this.#symbols[name];

    const sym = new cs.UniqueSymbol(this, name);
    this.#symbols[name] = sym;

    return sym;
  }

  createSymbol(){
    return new cs.UniqueSymbol(this);
  }

  generateName(sym){
    const name = sym.name = Scope.genSymName(this.#nameIndex++);
    assert(!(name in this.#symbols));

    this.#symbols[name] = sym;

    return name;
  }
}

const ctors = {
  Scope,
};

Object.assign(cs, ctors);
module.exports = cs;