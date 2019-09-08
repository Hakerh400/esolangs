'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

module.exports = src => {
  return [
    '',
    'A',
    '123',
  ].map(a => {
    return [a, Buffer.from(a).map(a => {
      return a ^ 255;
    })];
  });
};