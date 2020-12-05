'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const encData = require('./encodings-data');

const has = type => {
  return type in encData;
};

const get = type => {
  assert(has(type));

const enc = require(`./${type}`);

  return enc;
};

module.exports = {
  encData,
  has,
  get,
};