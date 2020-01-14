'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../../..');
const Gate = require('./gate');

class GateOr extends Gate{
  constructor(in1, in2, out1){
    super();

    this.in1 = in1;
    this.in2 = in2;
    this.out1 = out1;
  }

  tick(mode){
    this.out1.set(
      this.in1.get(mode) |
      this.in2.get(mode),
    mode);
  }
}

module.exports = GateOr;