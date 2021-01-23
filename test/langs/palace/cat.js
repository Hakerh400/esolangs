'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../../..');

module.exports = src => {
  return [
    ['123', '123'],
  ].map(a => {
    a.inputFormat = 'nat-array';
    a.outputFormat = 'nat';
    return a;
  });
};