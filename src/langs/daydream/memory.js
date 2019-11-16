'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');

class Memory{
  #data = new Map();

  get(addr, indirection=0){
    const data = this.#data;

    for(indirection++; indirection !== 0; indirection--){
      if(addr < 0) addr = -addr;
      addr = data.has(addr) ? data.get(addr) : 0n;
    }

    return addr;
  }

  set(addr, val){
    if(addr < 0) addr = -addr;
    this.#data.set(addr, val);
  }
}

module.exports = Memory;