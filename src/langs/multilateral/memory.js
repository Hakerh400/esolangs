'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

class Memory{
  #data = new O.MultidimensionalMap();

  get(ptr){
    const d = this.#data;

    ptr = ptr.slice();
    while(O.last(ptr) === 0n)
      ptr.pop();

    const val = d.get(ptr);
    if(val !== null) return val;

    d.set(ptr, 0n);
    return 0n;
  }

  set(ptr, val){
    const d = this.#data;

    ptr = ptr.slice();
    while(O.last(ptr) === 0n)
      ptr.pop();

    d.set(ptr, val);
  }

  inc(ptr){
    this.set(ptr, this.get(ptr) + 1n);
  }

  dec(ptr){
    this.set(ptr, this.get(ptr) - 1n);
  }
}

module.exports = Memory;