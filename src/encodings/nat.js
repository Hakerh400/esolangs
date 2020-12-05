'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('..');

const encode = buf => {
  const str = buf.toString();

  if(!/^(?:0|[1-9][0-9]*)$/.test(str))
    return null;

  return BigInt(str);
};

const decode = num => {
  return Buffer.from(String(num));
};

module.exports = {
  encode,
  decode,
};