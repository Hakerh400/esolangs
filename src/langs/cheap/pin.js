'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

class Pin{
  #component = null;
  #prev = 0;
  #val = 0;

  constructor(component){
    this.#component = component;
  }

  get prev(){ return this.#prev; }
  get val(){ return this.#val; }

  set val(val){
    val |= 0;
    if(val === this.#val) return;

    this.#prev = this.#val;
    this.#val = val;

    this.#component.update();
  }
}

module.exports = Pin;