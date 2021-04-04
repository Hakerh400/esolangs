'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

class Base extends O.Stringifiable{}

class Program extends Base{
  insts = [];

  constructor(labelsAndInsts){
    super();

    const {insts} = this;
    const labs = O.obj();

    for(const labelOrInst of labelsAndInsts){
      if(labelOrInst instanceof Label){
        labs[labelOrInst.name] = insts.length;
        continue;
      }

      insts.push(labelOrInst);
    }

    for(const inst of insts){
      if(!(inst instanceof Jump)) continue;

      const lab = inst.target;

      if(!O.has(labs, lab))
        esolangs.err(`Undefined label ${O.sf(lab)}`);

      inst.label = lab;
      inst.target = labs[lab];
    }
  }
}

class Label extends Base{
  constructor(name){
    super();
    this.name = name;
  }
}

class Instruction extends Base{}

class Copy extends Instruction{
  constructor(from, to){
    super();
    this.from = from;
    this.to = to;
  }

  toStr(){
    return [this.from, this.to].map(a => a.join('')).join('.');
  }
}

class Comp extends Instruction{
  constructor(addr1, addr2){
    super();
    this.addr1 = addr1;
    this.addr2 = addr2;
  }

  toStr(){
    return [this.addr1, this.addr2].map(a => a.join('')).join('?');
  }
}

class Jump extends Instruction{
  label = null;

  constructor(target){
    super();
    this.target = target;
  }

  toStr(){
    assert(this.label !== null);
    return `:${this.label}`;
  }
}

module.exports = {
  Base,
  Program,
  Label,
  Instruction,
  Copy,
  Comp,
  Jump,
};