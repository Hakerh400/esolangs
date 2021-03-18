'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const parser = require('./parser');
const cs = require('./ctors');

const DEBUG = 0;

const run = (src, input) => {
  return Buffer.from([]);
};

module.exports = run;