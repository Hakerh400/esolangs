'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

module.exports = fTime;

function fTime(t){
  var years = t / (60 * 60 * 24 * 31 * 12) | 0;
  var months = t / (60 * 60 * 24 * 31) % 12 | 0;
  var days = t / (60 * 60 * 24) % 31 | 0;

  var h = `${t / (60 * 60) % 24 | 0}`.padStart(2, '0');
  var m = `${t / 60 % 60 | 0}`.padStart(2, '0');
  var s = `${t % 60 | 0}`.padStart(2, '0');

  var str = `${h}:${m}:${s}`;

  if((t / (60 * 60 * 24) | 0) === 0)
    return str;

  return `${years}y ${months}m ${days}d ${str}`;
}