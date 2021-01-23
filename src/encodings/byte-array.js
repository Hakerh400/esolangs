'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('..');

const encode = buf => {
  const ser = new O.NatSerializer();

  for(const byte of buf){
    ser.inc();
    ser.write(256, byte);
  }

  return ser.output;
};

const decode = num => {
  const ser = new O.NatSerializer(num);
  const arr = [];

  while(ser.nz)
    arr.push(Number(ser.read(256)));

  return Buffer.from(arr);
};

module.exports = {
  encode,
  decode,
};