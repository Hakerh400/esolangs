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
  ip = 0;

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

class Object extends Base{
  #map = new Map();

  get(obj){
    const map = this.#map;

    if(!map.has(obj)){
      const objNew = new Object();
      map.set(obj, objNew);
      return objNew;
    }

    return map.get(obj);
  }

  set(obj1, obj2){
    const map = this.#map;
    map.set(obj1, obj2);
  }

  toStr(seen){
    if(seen.has(this))
      return seen.get(this);

    const id = String(seen.size + 1);
    seen.set(this, id);

    const map = this.#map;

    if(map.size === 0)
      return `${id}{}`;

    const arr = [this.inc, id, '{'];

    for(const [key, val] of map)
      arr.push('\n', key, ': ', val);

    arr.push(this.dec, '\n}');

    return arr;
  }

  toString(){
    return super.toString(new Map());
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
  Object,
};