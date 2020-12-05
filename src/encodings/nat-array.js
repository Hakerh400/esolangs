'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('..');

const encode = buf => {
  const str = buf.toString();
  const ser = new O.NatSerializer();

  let err = 0;

  const arr = str.split(' ').map(str => {
    if(!/^(?:0|[1-9][0-9]*)$/.test(str)){
      err = 1;
      return null;
    }

    return BigInt(str);
  });

  if(err) return null;

  for(let num of arr){
    ser.inc();
    num++;

    while(num !== 1n){
      ser.write(2n, 1n);
      ser.write(2n, num & 1n);
      num >>= 1n;
    }

    ser.write(2n, 0n);
  }

  return ser.output;
};

const decode = num => {
  const ser = new O.NatSerializer(num);
  const arr = [];

  while(ser.nz){
    let mult = 1n;
    let n = 0n;

    while(ser.read(2n) === 1n){
      if(ser.read(2n) === 1n) n += mult;
      mult <<= 1n;
    }

    n += mult - 1n;
    arr.push(n);
  }

  return arr.join(' ');
};

module.exports = {
  encode,
  decode,
};