'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

class Base extends O.Stringifiable{}

class Element extends Base{}

class List extends Element{
  #identsStack = null;

  elems = [];

  constructor(elems=null){
    super();

    if(elems !== null)
      for(const elem of elems)
        this.push(elem);
  }

  get identsStack(){
    if(this.#identsStack === null)
      return this.#identsStack = [];

    return this.#identsStack;
  }

  get len(){ return this.elems.length; }

  push(elem){
    this.elems.push(elem);
  }

  slice(){
    return new List(this);
  }

  [Symbol.iterator](){
    return this.elems[Symbol.iterator]();
  }

  toStr(){
    const arr = ['('];
    this.join(arr, this.elems, '');
    arr.push(')');
    return arr;
  }
}

class Identifier extends Element{
  constructor(name){
    super();

    this.name = name;
  }

  toStr(){
    if(this.name.length === 1) return this.name;
    return `\\${this.name} `;
  }
}

class CodeBlock extends Base{
  insts = [];

  push(inst){
    this.insts.push(inst);
  }

  toStr(){
    return this.join([], this.insts, '\n');
  }
}

class Instruction extends Base{
  constructor(addr1, addr2){
    super();

    this.addr1 = addr1;
    this.addr2 = addr2;
  }
}

class Assignment extends Instruction{
  toStr(){
    return [this.addr1, ' = ', this.addr2];
  }
}

class Input extends Instruction{
  toStr(){
    return [this.inc, 'if input\n', this.addr1, ' = ', this.addr2, this.dec];
  }
}

class Output extends Instruction{
  toStr(){
    return ['output ', this.addr1, ' == ', this.addr2, ''];
  }
}

class Loop extends Instruction{
  block = new CodeBlock();

  toStr(){
    return [
      this.inc, 'while ', this.addr1, ' == ', this.addr2,
      this.block.insts.length !== 0 ? '\n' : '',
      this.block, this.dec,
    ];
  }
}

module.exports = {
  Base,
  Element,
  List,
  Identifier,
  CodeBlock,
  Instruction,
  Assignment,
  Input,
  Output,
  Loop,
};