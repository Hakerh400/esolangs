'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

module.exports = src => {
  return [
    ['', esolangs.getStr('99-bottles')],
  ];
};