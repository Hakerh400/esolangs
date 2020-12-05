'use strict';

const O = require('omikron');
const functional = require('./functional');

const {Machine} = functional;

const run = (src, input) => {
  src = src.toString();

  const machine = new Machine(src);
  const io = new functional.IO(machine, input);

  for(const a of machine.start());
  if(machine.error) esolangs.err('Something went wrong');

  return io.getOutput();
};

module.exports = run;