'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

module.exports = src => {
  if(src.length === 0)
    throw new TypeError('Quine program cannot be empty');

  return [
    ['', src],
  ];
};