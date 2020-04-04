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
  let interactive = 0;

  if(args.length === 3){
    if(O.last(args) !== '--interactive') errArgs();
    interactive = 1;
  }else if(args.length !== 4) errArgs();

  const [id, fsrc] = args;
  const info = esolangs.getInfoById(id);
  if(info === null) err(`Unsupported language with ID ${O.sf(id)}`);

  const src = read(fsrc);

  if(!interactive){
    const [fin, fout] = args.slice(2);
    const input = read(fin);
    const output = esolangs.run(info.name, src, input);

    write(fout, output);
    return;
  }

  esolangs.run(info.name, src, null);
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

const errArgs = () => {
  err(`Invalid arguments\nUsage: node index <language> <source> <input> <output>`);
};

const err = msg => {
  log(`ERROR: ${msg}`);
  process.exit(1);
};

module.exports = {
  isInvoked,
  exec,
};