'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../../..');

module.exports = src => {
  return [
    ['123', '246'],
  ].map(([...a]) => {
    return [...a, ['nat', 'nat']];
  });
};