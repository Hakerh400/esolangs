'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

const run = (src, input) => {
  return esolangs.run('HQ9+', src, input);
};

module.exports = run;