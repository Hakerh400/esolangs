'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');

class Memory{
  #data = new Map();
  #transaction = null;

  get(addr, indirection=0){
    const data = this.#data;

    for(indirection++; indirection !== 0; indirection--)
      addr = data.has(addr) ? data.get(addr) : 0n;

    return addr;
  }

  set(addr, val){
    const tr = this.#transaction;
    if(tr !== null) tr.push(addr, val);
    else this.#data.set(addr, val);
  }

  startTransaction(){
    this.#transaction = [];
  }

  commit(){
    const data = this.#data;
    const tr = this.#transaction;

    for(let i = 0; i !== tr.length; i += 2)
      data.set(tr[i], tr[i + 1]);

    this.#transaction = null;
  }

  dismiss(){
    this.#transaction = null;
  }
}

module.exports = Memory;