'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

const run = (src, input) => {
  if(src.length !== 0)
    esolangs.err(`Only empty program is allowed`);

  input = input.toString();

  if(!/^\d+$/.test(input))
    esolangs.err(`Expected a decimal number as input`);

  return Buffer.from(O.isPrime(BigInt(input)) ? '1' : '0');
};

module.exports = run;