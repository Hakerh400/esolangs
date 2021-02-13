'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('..');

const encode = buf => {
  const str = buf.toString();
  const ser = new O.NatSerializer();

  if(!/^[01]*$/.test(str))
    return null;

  for(let i = 0; i !== str.length; i++){
    ser.inc();
    ser.write(str[i]);
  }

  return ser.output;
};

const decode = num => {
  const ser = new O.NatSerializer(num);
  let str = '';

  while(ser.nz)
    str += ser.read();
  
  return Buffer.from(str);
};

module.exports = {
  encode,
  decode,
};