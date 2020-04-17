'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const parser = require('../../common/parser');
const ast = require('./ast');
const Engine = require('./engine');
const cs = require('./ctors');

const cwd = __dirname;
const syntax = O.rfs(path.join(cwd, 'syntax.txt'), 1);

const run = src => {
  const parsed = parser.parse(syntax, src, ast);
  const eng = new Engine(parsed);
  
  eng.run();

  return eng.getOutput();
};

module.exports = run;