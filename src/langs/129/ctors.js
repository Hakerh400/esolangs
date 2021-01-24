'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

class Base extends O.Stringifiable{}

class Stack extends Base{
  static get empty(){
    return new this();
  }

  static fromInt(n){
    return new Stack(O.ca(n, () => this.empty));
  }

  elems = [];

  constructor(elems=[]){
    super();

    this.pushArr(elems);
  }

  get len(){
    return this.elems.length;
  }

  get empty(){
    return this.len === 0;
  }

  rev(){
    this.elems.reverse();
    return this;
  }

  top(){
    if(this.empty) return null;
    return this.elems[0];
  }

  push(elem){
    this.elems.unshift(elem);
    return this;
  }

  pushArr(arr){
    for(let i = arr.length - 1; i !== -1; i--)
      this.push(arr[i]);

    return this;
  }

  pushStack(stack){
    return this.pushArr(stack.elems);
  }

  pop(elem){
    if(this.empty) return null;
    return this.elems.shift();
  }

  dup(){
    return new Stack(this.elems);
  }

  get int(){ return this.len; }
  get ints(){ return this.elems.map(a => a.int); }

  toStr(){
    const arr = ['('];
    this.join(arr, this.elems, '');
    arr.push(')');
    return arr;
  }
}

module.exports = {
  Base,
  Stack,
};