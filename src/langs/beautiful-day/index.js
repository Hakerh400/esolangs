'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const stringGen = require('../../common/string-generator');

const run = (src, input) => {
  src = src.toString();
  input = input.toString();

  const gen = stringGen(src, str => {
    return input.startsWith(str);
  });

  for(const str of gen)
    if(str === input)
      return Buffer.from('1');

  return Buffer.from('0');
};

module.exports = run;