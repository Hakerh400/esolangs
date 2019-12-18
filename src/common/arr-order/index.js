'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const arr = (vals, id, dir=0) => {
  const n = BigInt(vals.length);
  const arr = [];

  id = BigInt(id);

  while(id !== 0n){
    let val = vals[--id % n];
    id /= n;

    if(dir) arr.push(val);
    else arr.unshift(val);
  }

  return arr;
};

const str = (chars, id, dir=0) => {
  const n = BigInt(chars.length);
  let str = '';

  id = BigInt(id);

  while(id !== 0n){
    let val = chars[--id % n];
    id /= n;

    if(dir) str += val;
    else str = val + str;
  }

  return str;
};

const id = (vals, arr, dir=0) => {
  const n = BigInt(vals.length);
  const len = arr.length;
  const map = new Map();

  let id = 0n;

  let start = dir ? len - 1 : 0;
  let end = dir ? -1 : len;
  let d = dir ? -1 : 1;

  vals.forEach((val, index) => {
    map.set(val, BigInt(index));
  });

  for(let index = start; index !== end; index += d){
    let val = arr[index];
    id = id * n + BigInt(map.get(val)) + 1n;
  }

  return id;
};

module.exports = {
  arr,
  str,
  id,
};