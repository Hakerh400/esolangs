'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../../..');

module.exports = src => {
  return [
    ['123', '124'],
  ].map(a => {
    a.inputFormat = 'nat';
    a.outputFormat = 'nat';
    return a;
  });
};