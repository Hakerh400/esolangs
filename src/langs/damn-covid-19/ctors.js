'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const cmds = require('./cmds');
const conds = require('./conds');

class Base extends O.Stringifiable{}

class Program extends Base{
  constructor(tapeSize, insts){
    super();

    this.tapeSize = tapeSize;
    this.insts = insts;
  }

  toStr(){
    const arr = [String(this.tapeSize)];

    if(this.insts.length !== 0){
      arr.push('\n\n');
      this.join(arr, this.insts, '\n');
    }

    return arr;
  }
}

class Instruction extends Base{}

class Command extends Instruction{
  constructor(cmd){
    super();
    this.cmd = cmd;
  }

  toStr(){
    return ['^', 'v', '<', '>', '~<', '~>', '!', '@', '%'][this.cmd];
  }
}

class Control extends Instruction{}

class If extends Control{
  constructor(cond, insts1, insts2){
    super();

    this.cond = cond;
    this.insts1 = insts1;
    this.insts2 = insts2;
  }

  toStr(){
    const arr = ['?', this.cond];

    if(this.insts1.length !== 0){
      arr.push(this.inc, '(\n');
      this.join(arr, this.insts1, '\n');
      arr.push(this.dec, '\n)');
    }else{
      arr.push('()');
    }

    if(this.insts2.length !== 0){
      arr.push(this.inc, ':(\n');
      this.join(arr, this.insts2, '\n');
      arr.push(this.dec, '\n)');
    }

    return arr;
  }
}

class Loop extends Control{
  constructor(cond, insts){
    super();

    this.cond = cond;
    this.insts = insts;
  }

  toStr(){
    const arr = ['?', this.cond];

    if(this.insts.length !== 0){
      arr.push(this.inc, '{\n');
      this.join(arr, this.insts, '\n');
      arr.push(this.dec, '\n}');
    }else{
      arr.push('{}');
    }

    return arr;
  }
}

class Condition extends Base{
  constructor(cond, inverted){
    super();

    this.cond = cond;
    this.inverted = inverted;
  }

  toStr(){
    const arr = [];

    if(this.inverted) arr.push('!');
    arr.push(['#', '^', 'v', '<', '>', '.', '@'][this.cond]);

    return arr;
  }
}

module.exports = {
  Base,
  Program,
  Instruction,
  Command,
  Control,
  If,
  Loop,
  Condition,
};