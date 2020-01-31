'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const Chip = require('./chip');

const run = (src, input) => {
  const buf = O.bits2buf(src.toString().replace(/^[01]+/g, ''));
  const io = new O.IO(input, 0, 1);

  let ser = new O.Serializer(buf);

  while(1){
    const chip = Chip.deser(ser);

    chip.setIO(io);
    chip.run();

    const output = chip.getOutput();

    if(chip.done) return output;
    ser = new O.Serializer(output);
  }
};

module.exports = run;