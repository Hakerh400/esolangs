'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../../..');

module.exports = src => {
  return [
    [
      '{{}, {{}}, {{}, {{}}}}',
      '{{}, {{}}}',
      ['set', 'set'],
    ],
  ];
};