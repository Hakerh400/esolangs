'use strict';

const fs = require('fs');
const O = require('../omikron');

const fdIn = process.stdin.fd;
const buff = Buffer.alloc(2);

module.exports = debug;

function debug(...args){
  log(...args);
  fs.readSync(fdIn, buff, 0, 2);
  return O.last(args);
}