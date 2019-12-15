'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

class Base{}

class Block extends Base{
  parent = null;
  index = 0;

  constructor(insts){
    super();
    this.insts = insts;

    for(const inst of insts)
      if(inst instanceof Loop)
        inst.block.parent = this;
  }
}

class Instruction extends Base{}

class Move extends Instruction{
  constructor(dir, dim){
    super();
    this.dir = dir;
    this.dim = dim;
  }
}

class Modify extends Instruction{
  constructor(dif){
    super();
    this.dif = dif;
  }
}

class IO extends Instruction{}
class Input extends IO{}
class Output extends IO{}

class Loop extends Instruction{
  constructor(block){
    super();
    this.block = block;
  }
}

module.exports = {
  Base,
  Block,
  Instruction,
  Move,
  Modify,
  IO,
  Input,
  Output,
  Loop,
};