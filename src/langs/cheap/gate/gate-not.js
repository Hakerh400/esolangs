'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../../..');
const Gate = require('./gate');

class GateNot extends Gate{
  constructor(in1, out1){
    super();

    this.in1 = in1;
    this.out1 = out1;
  }

  tick(mode){
    this.out1.set(
      this.in1.get(mode) ^ 1,
    mode);
  }
}

module.exports = GateNot;