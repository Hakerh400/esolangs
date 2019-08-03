'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const hq9Plus = require('../hq9-plus');

const run = (src, input) => {
  return hq9Plus(src, input);
};

module.exports = run;