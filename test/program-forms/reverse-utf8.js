'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

module.exports = src => {
  return [
    'Добрый день',
  ].map(a => [a, O.rev(a)]);
};