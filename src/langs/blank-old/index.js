'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const parser = require('../../common/parsers/elevated-parser');
const debug = require('../../common/debug');
const ast = require('./ast');
const Engine = require('./engine');
const cs = require('./ctors');

const cwd = __dirname;
const syntax = O.rfs(path.join(cwd, 'syntax.txt'), 1);

const run = (src, input) => {
  const parsed = parser.parse(syntax, src, ast);
  const eng = new Engine(parsed, Buffer.from(input));
  
  eng.run();

  return eng.getOutput();
};

module.exports = run;