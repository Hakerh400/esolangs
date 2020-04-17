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
  const interactive = O.last(args) === '--interactive';

  if(interactive){
    args.pop();
  }

  if(args.length < 2) errArgs();

  const [id, fsrc] = args.splice(0, 2);
  const info = esolangs.getInfoById(id);
  if(info === null) err(`Unsupported language with ID ${O.sf(id)}`);

  const src = read(fsrc);

  if(interactive){
    if(args.length !== 0) errArgs();
    esolangs.run(info.name, src, null);
    return;
  }

  if(args.length < 1 || args.length > 2) errArgs();

  const hasInput = args.length === 2;
  const fin = hasInput ? args[0] : null;
  const fout = hasInput ? args[1] : args[0];
  const input = hasInput ? read(fin) : null;
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

const errArgs = () => {
  if(process.argv.length !== 2)
    err('Invalid arguments\n', 0);

  log(
    `Usage: node index <language> <source> <input> <output>\n` +
    `Parameter <input> should be omitted for output-only languages\n` +
    `For interactive mode add --interactive flag instead of <input> <output>`
  );
};

const err = (msg, exit=1) => {
  log(`ERROR: ${msg}`);
  if(exit) process.exit(1);
};

module.exports = {
  isInvoked,
  exec: () => exec(args.slice()),
};