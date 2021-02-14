'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../../..');

module.exports = src => {
  return [
    ['', '1'],
    ['A', '1'],
    ['AAAAA', '1'],
    ['AAABA', '0'],
    ['C', '0'],
  ].map(a => [...a, ['text', null]]);
};