'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');

class Transaction{
  #mem;
  #data = new Map();

  constructor(mem){
    this.#mem = mem;
  }

  get mem(){ return this.#mem; }

  get(addr){
    if(addr < 0n) addr = -addr;
    const data = this.#data;

    if(!data.has(addr))
      return this.#mem.get(addr);

    return data.get(addr);
  }

  set(addr, val){
    if(addr < 0n) addr = -addr;
    const data = this.#data;
    data.set(addr, val);
  }

  commit(){
    const mem = this.#mem;

    for(const [addr, val] of this.#data)
      mem.set(addr, val);
  }
}

module.exports = Transaction;