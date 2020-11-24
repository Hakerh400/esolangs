'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

module.exports = (
  O.isElectron ? console.logRaw.bind(console) : logSync
);

function logSync(data){
  if(O.isBrowser)
    throw new O.CustomError('Synchronous console output is not supported');

  fs.writeSync(process.stdout.fd, data);
}