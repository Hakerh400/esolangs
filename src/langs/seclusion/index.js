'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const parser = require('../../common/parser');
const syntaxRules = require('./syntax-rules');

const cwd = __dirname;
const syntax = O.rfs(path.join(cwd, 'syntax.txt'), 1);

const run = (src, input) => {
  const parsed = parser.parse(syntax, src, syntaxRules);
  return parsed;
};

module.exports = run;