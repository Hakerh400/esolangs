'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const Transaction = require('./transaction');

class Memory{
  static Transaction = Transaction;

  #data = new Map();

  get(addr){
    if(addr < 0n) addr = -addr;
    const data = this.#data;
    if(!data.has(addr)) return 0n;
    return data.get(addr);
  }

  set(addr, val){
    if(addr < 0n) addr = -addr;
    const data = this.#data;
    data.set(addr, val);
  }

  createTransaction(){
    return new Transaction(this);
  }
}

module.exports = Memory;