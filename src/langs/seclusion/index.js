'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const parser = require('../../common/parser');
const syntaxRules = require('./syntax-rules');
const Engine = require('./engine');

const cwd = __dirname;
const syntax = O.rfs(path.join(cwd, 'syntax.txt'), 1);

const run = (src, input) => {
  const parsed = parser.parse(syntax, src, syntaxRules);
  if(parsed === null) throw '';

  const eng = new Engine(parsed, Buffer.from(input));
  eng.run();

  return eng.getOutput();
};

module.exports = run;