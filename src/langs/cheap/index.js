'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const ChipBuilder = require('./chip-builder');
const Chip = require('./chip');
const Component = require('./component');

const run = (src, input) => {
  const bits = src.toString().replace(/^[01]+/g, '');
  const io = new O.IO(input, 0, 1);

  let a = new ChipBuilder();

  return io.getOutput();
};

module.exports = run;