'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const fdOut = process.stdout.fd;

module.exports = (
  O.isElectron ? console.logRaw.bind(console) : logSync
);

function logSync(data){
  fs.writeSync(fdOut, data);
}