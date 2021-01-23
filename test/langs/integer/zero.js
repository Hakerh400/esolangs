'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../../..');

module.exports = src => {
  return [
    ['123', '0'],
  ].map(a => {
    a.inputFormat = 'nat';
    a.outputFormat = 'nat';
    return a;
  });
};