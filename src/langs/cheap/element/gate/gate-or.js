'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const Gate = require('./gate');

class GateOr extends Gate{
  constructor(chip){
    super(chip, 2, 1);
  }

  get tick(){
    this.outputs[0].set(
      this.inputs[0].get() |
      this.inputs[1].get()
    );
  }
}

module.exports = GateOr;