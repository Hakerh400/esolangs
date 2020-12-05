'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('..');

const encode = buf => {
  const str = buf.toString();

  if(!/^[01]$/.test(str))
    return null;

  return BigInt(str);
};

const decode = num => {
  if(num > 1n) return null;
  return Buffer.from(String(num));
};

module.exports = {
  encode,
  decode,
};