'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

const ws = [0x09, 0x0A, 0x0D, 0x20];

const parse = src => {
  let ser = new O.NatSerializer();

  for(const byte of src){
    if(ws.includes(byte))
      continue;

    if(byte < 0x21 || byte > 0x7e)
      esolangs.err(`Invalid character`);

    ser.inc();
    ser.write(94, byte - 0x21);
  }

  ser = new O.NatSerializer(ser.output);

  let labModBits = '';

  while(ser.read(2))
    labModBits += ser.read(2);

  const labMod = BigInt(`0b1${O.rev(labModBits)}`);
  const lastLabIndex = labMod - 1n;
  const insts = [];

  while(BigInt(insts.length) < lastLabIndex || ser.nz){
    const op = Number(ser.read(11));

    if(op !== 7){
      insts.push(op);
      continue;
    }

    insts.push([Number(ser.read(labMod))]);
  }

  return insts;
};

module.exports = {
  parse,
};