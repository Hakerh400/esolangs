'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

class Base extends O.Stringifiable{}

class Program extends Base{
  constructor(insts){
    super();

    this.instsOrig = insts;

    const labs = O.obj();
    let labsNum = 0;

    insts = insts.filter((inst, i) => {
      if(!(inst instanceof Label)) return 1;

      const {name} = inst;

      if(name in labs)
        esolangs.err(`Duplicate label ${O.sf(name)}`);

      labs[name] = i - labsNum++;

      return 0;
    });

    insts.forEach(inst => {
      if(!(inst instanceof Jmp)) return;

      const {lab} = inst;

      if(!(lab in labs))
        esolangs.err(`Undefined label ${O.sf(lab)}`);

      inst.index = labs[lab];
    });

    this.insts = insts;
  }

  toStr(){
    const {instsOrig: insts} = this;
    const tab = ' '.repeat(2);
    const arr = [];

    for(let i = 0; i !== insts.length; i++){
      const inst = insts[i];

      if(i !== 0) arr.push('\n');
      if(!(inst instanceof Label)) arr.push(tab);
      arr.push(inst);
    }

    return arr;
  }
}

class Label extends Base{
  constructor(name){
    super();
    this.name = name;
  }

  toStr(){
    return [this.name, ':'];
  }
}

class Assignment extends Base{
  constructor(name, expr){
    super();
    this.name = name;
    this.expr = expr;
  }

  toStr(){
    return [this.name, ' = ', this.expr];
  }
}

class Get extends Base{
  constructor(name, key){
    super();
    this.name = name;
    this.key = key;
  }

  toStr(){
    return ['GET ', this.name, ' ', this.key];
  }
}

class Set extends Base{
  constructor(name, key, val){
    super();
    this.name = name;
    this.key = key;
    this.val = val;
  }

  toStr(){
    return ['SET ', this.name, ' ', this.key, ' ', this.val];
  }
}

class All extends Base{
  constructor(name){
    super();
    this.name = name;
  }

  toStr(){
    return ['ALL ', this.name];
  }
}

class Cmp extends Base{
  constructor(name1, name2){
    super();
    this.name1 = name1;
    this.name2 = name2;
  }

  toStr(){
    return ['CMP ', this.name1, ' ', this.name2];
  }
}

class Jmp extends Base{
  index = null;

  constructor(lab){
    super();
    this.lab = lab;
  }

  toStr(){
    return ['JMP ', this.lab];
  }
}

class Inp extends Base{
  constructor(){
    super();
  }

  toStr(){
    return ['INP'];
  }
}

class Eof extends Base{
  constructor(){
    super();
  }

  toStr(){
    return ['EOF'];
  }
}

class Out extends Base{
  constructor(bit){
    super();
    this.bit = bit;
  }

  toStr(){
    return ['OUT ', String(this.bit)];
  }
}

class Nop extends Base{
  constructor(){
    super();
  }

  toStr(){
    return ['NOP'];
  }
}

class Variable extends Base{
  constructor(name){
    super();
    this.name = name;
  }

  toStr(){
    return [this.name];
  }
}

module.exports = {
  Base,
  Program,
  Label,
  Assignment,
  Get,
  Set,
  All,
  Cmp,
  Jmp,
  Inp,
  Eof,
  Out,
  Nop,
  Variable,
};