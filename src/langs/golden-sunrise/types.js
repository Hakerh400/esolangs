'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

const types = O.enum([
  'BIT0',
  'BIT1',
  'MATCH',
  'GROUP_START',
  'GROUP_END',
]);

module.exports = types;