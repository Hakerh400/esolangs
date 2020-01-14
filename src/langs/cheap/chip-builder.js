'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const Chip = require('./chip');
const ComponentTemplate = require('./component-template');
const Pin = require('./pin');

class ChipBuilder{
  #gen = this.generator();
  #chip = null;
  #done = 0;

  constructor(){
    this.#gen.next();
  }

  get done(){ return this.#done; }
  get chip(){ return this.#chip; }

  write(bit){
    if(this.#done === 1)
      throw new TypeError('Redundant bit detected');

    const result = this.#gen.next(bit | 0);

    if(result.done){
      this.#done = 1;
      this.#chip = result.value;
    }
  }

  *generator(){
    const chip = new Chip();
    const mainComponent = new Component(chip, 1, 4);
    const allComponents = Component.natives;
    const componentsQueue = [mainComponent];

    while(componentsQueue !== 0){
      const component = componentsQueue.shift();
    }

    chip.mainComponent = mainComponent;

    return chip;
  }
}

module.exports = ChipBuilder;