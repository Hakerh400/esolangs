'use strict';

const fs = require('fs');
const O = require('../omikron');

const fdIn = process.stdin.fd;
const buf = Buffer.alloc(1);

const debug = (...args) => {
  log(...args);

  while(1){
    fs.readSync(fdIn, buf, 0, 1);

    if(buf[0] === 3) O.exit();
    if(buf[0] === 10) break;
  }

  return O.last(args);
};

module.exports = debug;