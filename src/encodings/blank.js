'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('..');

const encode = buf => {
  const str = buf.toString();
  const ser = new O.NatSerializer();

  // Code

  return ser.output;
};

const decode = num => {
  const ser = new O.NatSerializer(num);
  
  // Code
};

module.exports = {
  encode,
  decode,
};