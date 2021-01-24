'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('..');

const TEXT = 1;

const cwd = __dirname;

const langNameFile = path.join(cwd, 'lang.txt');
const name = O.rfs(langNameFile, 1);
const info = esolangs.getInfo(name);

const srcFile = path.join(cwd, `srcs/${info.id}.txt`);
const inputFile = path.join(cwd, 'input.txt');

const opts = !TEXT ? {
  inputFormat: 'padded-bit-array',
  outputFormat: 'padded-bit-array',
} : {};

const main = async () => {
  esolangs.debugMode = 1;

  const outputOnly = O.has(info, 'outputOnly') && info.outputOnly;

  const src = O.rfs(srcFile);
  const input = !outputOnly ? O.rfs(inputFile) : null;
  const output = await esolangs.run(name, src, input, opts);
  
  log(String(output));
};

main().catch(O.error);