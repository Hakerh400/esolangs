'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

const run = (src, input) => {
  src = src.toString();
  
  const io = new O.IO(input, 0, 1);

  return io.getOutput();
};

module.exports = run;