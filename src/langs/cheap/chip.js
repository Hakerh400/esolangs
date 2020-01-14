'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

class Chip{
  #mainComponent = null;

  get mainComponent(){
    return this.#mainComponent;
  }

  set mainComponent(mainComponent){
    if(this.#mainComponent !== null)
      throw new TypeError('The main component has already been set');

    this.#mainComponent = mainComponent;
  }
}

module.exports = Chip;