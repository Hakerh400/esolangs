'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');
const Bit = require('./bit');

const parse = src => {
  src = src.toString().
    replace(/\s+/g, '').
    replace(/\./g, '0').
    replace(/\*/g, '11');

  const m = src.match(/[^01\(\)]/);
  if(m !== null) esolangs.err(`Invalid character ${O.sf(m[0])}`);

  while(/\(/.test(src)){
    let srcPrev = src;

    src = src.replace(/\(([^\(\)]*)\)/, (match, str) => {
      return str.replace(/./g, a => `10${a}`);
    });

    assert(src !== srcPrev);
  }

  assert(/^[01]*$/.test(src));

  const bits = Bit.fromArr(src);
  const prog = O.rec(cs.Function.parse, bits);

  const ser = new O.NatSerializer(BigInt(`0b${O.rev(src)}0`));
  let str = '';
  while(ser.nz)
    str += O.sfcc(0x21 + Number(ser.read(94)));
  log(str.replace(/.{100}/gs, a => `${a}\n`).trim());
  O.logb();

  // log(prog.toString());
  // O.logb();

  return prog;
};

module.exports = {
  parse,
};