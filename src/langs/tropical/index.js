'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const parser = require('../../common/parsers/lisparser');
const cs = require('./ctors');

const run = (src, input) => {
  log(input)
};

module.exports = run;