'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const fdIn = process.stdin.fd;

const rlSync = () => {
  const buf = Buffer.alloc(1);
  const arr = [];

  while(1){
    fs.readSync(fdIn, buf, 0, 1);
    if(buf[0] === 10) break;
    arr.push(buf[0]);
  }

  return Buffer.from(arr).toString();
};

module.exports = rlSync;