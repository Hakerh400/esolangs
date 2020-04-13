'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const scripts = require('./scripts');

const cwd = __dirname;

const run = async (scriptName, args) => {
  if(!O.has(scripts, scriptName))
    O.exit(`Unknown script ${O.sf(scriptName)}`);

  const scriptId = scripts[scriptName];
  const scriptPath = path.join(cwd, scriptId);
  const scriptFunc = require(scriptPath);

  await scriptFunc(args);
};

module.exports = {
  run,
};