'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('..');

const cwd = __dirname;

const langNameFile = path.join(cwd, 'lang.txt');
const name = O.rfs(langNameFile, 1);
const id = esolangs.getInfo(name).id;

const srcFile = path.join(cwd, `srcs/${id}.txt`);
const inputFile = path.join(cwd, 'input.txt');

const opts = {
  debug: 0,
  useBitIO: 0,
};

const main = () => {
  esolangs.debugMode = 1;

  const src = O.rfs(srcFile);
  const input = O.rfs(inputFile);
  const output = esolangs.run(name, src, input, opts);
  
  log(String(output));
};

main();