'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

module.exports = src => {
  return [
    '',
    'A',
  ].map(a => {
    return [a, Buffer.from(Buffer.from(a).reverse().map(a => {
      return parseInt(a.toString(2).split('').reverse().join('').padEnd(8, '0'), 2);
    }), 'binary')];
  });
};