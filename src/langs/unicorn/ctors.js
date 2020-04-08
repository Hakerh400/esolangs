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

    this.insts = insts;

    const instsNum = insts.length;
    const labs = O.obj();

    const missingLab = lab => {
      esolangs.err(`Undefined label ${O.sf(lab)}`);
    };

    for(let i = 0; i !== instsNum; i++){
      const inst = insts[i];
      const {lab} = inst;
      if(lab === null) continue;

      if(lab in labs)
        esolangs.err(`Duplicate label ${O.sf(lab)}`);

      labs[lab] = i;
    }

    for(const inst of insts){
      const {op} = inst;
      if(!op.isIf) continue;

      const {lab1, lab2} = op;

      if(!(lab1 in labs)) missingLab(lab1);
      if(!(lab2 in labs)) missingLab(lab2);

      op.index1 = labs[lab1];
      op.index2 = labs[lab2];
    }
  }

  toStr(){
    return this.join([], this.insts, '\n');
  }
}

class Instruction extends Base{
  constructor(lab, vari, op){
    super();

    this.lab = lab;
    this.vari = vari;
    this.op = op;
  }

  toStr(){
    const arr = [];

    if(this.lab !== null)
      arr.push(this.lab, ': ');

    arr.push('xy'[this.vari], this.op);

    return arr;
  }
}

class Operation extends Base{
  static #XOR = null;
  static #SHL = null;
  static #SHR = null;

  static get XOR(){
    if(Operation.#XOR === null)
      Operation.#XOR = new Xor();

    return Operation.#XOR;
  }

  static get SHL(){
    if(Operation.#SHL === null)
      Operation.#SHL = new Shl();

    return Operation.#SHL;
  }

  static get SHR(){
    if(Operation.#SHR === null)
      Operation.#SHR = new Shr();

    return Operation.#SHR;
  }

  get isXor(){ return 0; }
  get isShl(){ return 0; }
  get isShr(){ return 0; }
  get isIf(){ return 0; }
}

class Xor extends Operation{
  get isXor(){ return 1; }
  toStr(){ return '~'; }
}

class Shl extends Operation{
  get isShl(){ return 1; }
  toStr(){ return '+'; }
}

class Shr extends Operation{
  get isShr(){ return 1; }
  toStr(){ return '-'; }
}

class If extends Operation{
  index1 = null;
  index2 = null;

  constructor(lab1, lab2){
    super();

    this.lab1 = lab1;
    this.lab2 = lab2;
  }

  get isIf(){ return 1; }

  toStr(){
    return `? ${this.lab1} ${this.lab1}`;
  }
}

module.exports = {
  Base,
  Program,
  Instruction,
  Operation,
  Xor,
  Shl,
  Shr,
  If,
};