'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');

module.exports = src => {
  return [
    ['abcde', 'abcde'],
    ['1234xyz', '1234xyz'],
    [src, src],
  ];
};