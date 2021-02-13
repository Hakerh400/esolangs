'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('..');

const encode = buf => {
  const ser = new O.NatSerializer();
  let str = buf.toString();

  if(!/^[01]*$/.test(str))
    return null;

  while(str.length & 7)
    str += '0';

  for(let i = 0; i !== str.length; i++){
    ser.inc();
    ser.write(str[i]);
  }

  return ser.output;
};

const decode = num => {
  const ser = new O.NatSerializer(num);
  const bytes = [];

  loop: while(1){
    let byte = 0;
    let mult = 1;

    for(let i = 0; i !== 8; i++){
      if(!ser.nz){
        if(i !== 0) bytes.push(byte);
        break loop;
      }

      const bit = Number(ser.read());
      if(bit) byte |= bit * mult;

      mult <<= 1;
    }

    bytes.push(byte);
  }

  return Buffer.from(bytes);
};

module.exports = {
  encode,
  decode,
};