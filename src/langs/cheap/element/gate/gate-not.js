'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const Gate = require('./gate');

class GateNot extends Gate{
  constructor(chip){
    super(chip, 1, 1);
  }

  get tick(){
    this.outputs[0].set(
      this.inputs[0].get() ^ 1
    );
  }
}

module.exports = GateNot;