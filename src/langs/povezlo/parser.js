'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');
const Bit = require('./bit');

const parse = src => {
  src = src.toString().replace(/[^01]+/g, '');

  const bits = Bit.fromArr(src);
  const prog = O.rec(cs.Function.parse, bits);

  const ser = new O.NatSerializer(BigInt(`0b${O.rev(src)}`));
  let str = '';

  while(ser.nz)
    str += O.sfcc(0x21 + Number(ser.read(94)));

  // log(str);
  // O.logb();

  // log(prog.toString());
  // O.logb();

  return prog;
};

module.exports = {
  parse,
};