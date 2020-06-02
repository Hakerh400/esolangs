'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../../..');
const cs = require('.');

const {Base} = cs;

class UniqueSymbol extends Base{
  #name = null;

  constructor(scope, name=null){
    super();

    this.scope = scope;
    this.#name = name;
  }

  get name(){
    if(this.#name !== null)
      return this.#name;

    return this.#name = this.scope.generateName(this);
  }

  set name(name){
    assert(this.#name === null);
    this.#name = name;
  }

  toStr(){
    return this.name;
  }
}

const ctors = {
  UniqueSymbol,
};

Object.assign(cs, ctors);
module.exports = cs;