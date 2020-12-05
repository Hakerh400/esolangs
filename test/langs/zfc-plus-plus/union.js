'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../../..');

module.exports = src => {
  return [
    {
      0: '{{}, {{}}, {{}, {{}}}}',
      1: '{{{}}, {}}',
      inputFormat: 'set',
      outputFormat: 'set',
    },
  ];
};