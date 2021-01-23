'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

const SINGLE_CHAR_COMBINATORS = 0;

const core = O.enum([
  'K',
  'S',
  'IO',
  'READ',
  'WRITE',
  'WRITE0',
  'WRITE1',
  'BIT0',
  'BIT1',
]);

const getInfo = val => {
  if(typeof val !== 'number') return val;

  if(SINGLE_CHAR_COMBINATORS)
    return 'KSFABCD01'[val];

  return `{${core[val]}}`;
};

module.exports = Object.assign(core, {
  SINGLE_CHAR_COMBINATORS,

  getInfo,
});