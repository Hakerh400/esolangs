'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

module.exports = src => {
  return [
    '',
    'abcde',
    '1234xyz',
  ].map(a => [a, O.sortAsc(a.split('')).join('')]);
};