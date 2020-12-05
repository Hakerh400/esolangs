'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const Engine = require('./engine');

const run = (src, input) => {
  src = src.toString();

  const io = new O.IOBit(input);
  let writeFlag = 1;
  let active = 1;

  const read = () => {
    return io.read();
  };

  const write = bit => {
    if(writeFlag){
      if(bit) writeFlag = 0;
      else active = 0;
    }else{
      io.write(bit);
      writeFlag = 1;
    }
  };

  const eng = new Engine(src, read, write);
  while(active) eng.tick();

  return io.getOutput();
};

module.exports = run;