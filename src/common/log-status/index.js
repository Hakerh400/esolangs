'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const format = require('../format');
const logSync = require('../log-sync');

const MAX_STR_LEN = 160;

let startTime = null;

logStatus.reset = reset;

module.exports = logStatus;

function logStatus(f, n=null, type='frame'){
  const now = Date.now();
  if(startTime === null) startTime = now;

  const isSizeKnown = n !== null;
  const dt = now - startTime;
  const eta = calcTime(dt, f, n);

  const msgs = [
    `Processing ${type} ${format.num(f)}${isSizeKnown ? ` of ${format.num(n)}` : ``}`,
    ...isSizeKnown && eta >= 0 ? [`ETA: ${format.time(eta)}`] : [],
    ...dt !== 0 ? [`Speed: ${f / (dt / 1e3) + .5 | 0}`] : [],
  ];

  log(msgs.join(' '.repeat(2)));
}

function calcTime(dt, f, n){
  const remaining = dt * (n - f + 1) / f;
  return remaining / 1e3 + .5 | 0;
}

function log(str){
  if(str.length < MAX_STR_LEN)
    str += '\n';
  else if(str.length > MAX_STR_LEN)
    str = `${str.substring(0, MAX_STR_LEN - 3)}...`;

  logSync(str);
}

function reset(){
  startTime = null;
}