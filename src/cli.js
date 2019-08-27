'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('./esolangs');

const args = process.argv.slice(2);

const isInvoked = () => {
  return args.length !== 0;
};

const exec = () => {
  if(args.length !== 4)
    err(`Invalid arguments\nUsage: node index <language> <source> <input> <output>`);

  const [id, fsrc, fin, fout] = args;
  const info = esolangs.getInfoById(id);
  if(info === null) err(`Unsupported language with ID ${O.sf(id)}`);

  const src = read(fsrc);
  const input = read(fin);
  const output = esolangs.run(info.name, src, input);
  write(fout, output);
};

const read = file => {
  try{
    return O.rfs(file);
  }catch(e){
    err(`Unable to read file ${O.sf(file)}\n${e.message}`);
  }
};

const write = (file, buf) => {
  try{
    O.wfs(file, buf);
  }catch(e){
    err(`Unable to write file ${O.sf(file)}\n${e.message}`);
  }
};

const err = msg => {
  log(`ERROR: ${msg}`);
  process.exit(1);
};

module.exports = {
  isInvoked,
  exec,
};