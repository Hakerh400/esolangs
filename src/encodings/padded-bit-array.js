'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');

const encode = buf => {
  const str = buf.toString();
  const ser = new O.NatSerializer();

  if(!/^[01]*$/.test(str))
    return null;

  for(let i = 0; i < str.length; i += 8){
    let mult = 1;
    let n = 0;

    for(let j = 0; j !== 8; j++){
      if(str[i + j] === '1') n += mult;
      mult <<= 1;
    }

    ser.inc();
    ser.write(256, n);
  }

  return ser.output;
};

const decode = num => {
  const ser = new O.NatSerializer(num);
  let str = '';

  while(ser.nz){
    let n = Number(ser.read(256));

    for(let i = 0; i !== 8; i++){
      str += n & 1;
      n >>= 1;
    }
  }
  
  return Buffer.from(str);
};

module.exports = {
  encode,
  decode,
};