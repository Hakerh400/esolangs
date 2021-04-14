'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

class Bit{
  static fromArr(arr, pad=0, index=0){
    if(index === arr.length)
      return allZeros;

    const bit = new Bit(function*(){
      return [
        arr[index] & 1,
        Bit.fromArr(arr, pad, index + 1),
      ];
    });

    if(!pad) return bit;

    return new Bit(function*(){
      return [1, bit];
    });
  }

  #bit = null;
  #next = null;

  constructor(func){
    this.func = func;
  }

  get expanded(){
    return this.#bit !== null;
  }

  *expand(){
    if(this.expanded) return;

    const [bit, next] = yield [this.func];

    this.func = null;
    this.#bit = bit;
    this.#next = next;

    return this;
  }

  *getBit(){
    yield [[this, 'expand']];
    return this.#bit;
  }

  *getNext(){
    yield [[this, 'expand']];
    return this.#next;
  }

  get bit(){
    assert.fail();
  }

  get next(){
    assert.fail();
  }

  *getOutput(){
    let bits = this;
    let out = '';

    while(yield [[bits, 'getBit']]){
      bits = yield [[bits, 'getNext']];
      out += yield [[bits, 'getBit']];
      bits = yield [[bits, 'getNext']];
    }

    return out;
  }

  toString(len=100){
    let bits = this;
    let str = '';

    const toStr = function*(){
      for(let i = 0; i !== len; i++){
        str += yield [[bits, 'getBit']];
        bits = yield [[bits, 'getNext']];
      }

      return str;
    };

    return O.rec(toStr);
  }
}

const allZeros = new Bit(function*(){
  return [0, allZeros];
});

module.exports = Object.assign(Bit, {
  allZeros,
});