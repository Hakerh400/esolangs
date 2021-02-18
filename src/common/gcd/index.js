'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

const {ok} = assert;

const gcd = (a, b) => {
  ok(typeof a === 'bigint');
  ok(typeof b === 'bigint');

  if(a < b){
    const t = a;
    a = b;
    b = t;
  }

  ok(b >= 1n);

  while(1){
    if(b === 0n)
      return a;

    const t = a % b;
    a = b;
    b = t;
  }
};

module.exports = gcd;