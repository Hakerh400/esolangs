'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const encData = require('./encodings-data');

const has = type => {
  return O.has(encData, type);
};

const get = type => {
  assert(has(type));

  return require(`./${type}`);
};

module.exports = {
  encData,
  has,
  get,
};