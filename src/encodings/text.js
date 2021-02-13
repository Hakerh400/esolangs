'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('..');

const encode = buf => {
  const ser = new O.NatSerializer();

  for(const byte of buf){
    for(let i = 0; i !== 8; i++){
      ser.inc();
      ser.write(byte & (1 << i) ? 1 : 0);
    }
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