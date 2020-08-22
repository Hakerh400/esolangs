'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const parser = require('../../common/parsers/elevated-parser');
const ast = require('./ast');
const cs = require('./ctors');

const cwd = __dirname;
const syntax = O.rfs(path.join(cwd, 'syntax.txt'), 1);

const run = (src, input) => {
  const system = parser.parse(syntax, src, ast, 'system');
  const target = system.constructExpr(parser.parse(syntax, input, ast, 'target'));
  const solver = new cs.Solver(system, target);

  const solution = solver.solve();

  if(solution === null)
    return Buffer.from('No solution exists');

  return Buffer.from(solution.toString());
};

module.exports = run;