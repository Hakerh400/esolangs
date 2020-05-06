'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

class Base extends O.Stringifiable{}

class Program extends Base{
  constructor(sects){
    super();
    this.sects = sects;
  }
}

class Section extends Base{
  constructor(offset, insts){
    super();
    this.offset = offset;
    this.insts = insts;
  }
}

class Repeat extends Base{
  constructor(insts, count){
    super();

    if(count < 0n)
      esolangs.err(`Repeat count cannot be negative (got ${count})`);

    this.insts = insts;
    this.count = count;
  }
}

module.exports = {
  Base,
  Program,
  Section,
  Repeat,
};