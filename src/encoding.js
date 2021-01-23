'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const encodings = require('./encodings');

const checkType = type => {
  if(!encodings.has(type))
    esolangs.err(`Unknown encoding ${type}`);
};

const encode = async (data, type) => {
  checkType(type);
  return (await encodings.get(type)).encode(data);
};

const decode = async (data, type) => {
  checkType(type);
  return (await encodings.get(type)).decode(data);
};

module.exports = {
  encodings,
  checkType,
  encode,
  decode,
};

const esolangs = require('.');