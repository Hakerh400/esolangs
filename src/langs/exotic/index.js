'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');
const parser = require('./parser');
const solver = require('./solver');
const cs = require('./ctors');
const BinStr = require('./bin-str');

const run = (src, input) => {
  const prog = parser.parse(src);

  

  O.exit();
};

module.exports = run;