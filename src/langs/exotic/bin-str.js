'use strict';

const assert = require('assert');
const O = require('omikron');
const List = require('@hakerh400/list');
const esolangs = require('../..');

const {ArrayList} = List;

class BinStr{
  static fromStr(str){
    assert(typeof str === 'string');
    return new BinStr([...str].map(a => a & 1));
  }

  static fromInt(n){
    assert(typeof n === 'bigint');
    const str = O.rev((n + 1n).toString(2).slice(1));
    return BinStr.from(str);
  }

  static fromExpr(expr){
    const queue = new ArrayList([expr]);
    const n = 0n;

    while(queue.len !== 0){
      const expr = queue.shift();
      const last = queue.len === 0;
      const {type} === expr;

      if(!last) n <<= 1n;

      if(type === TERM)
        continue;

      if(type === PAIR){
        if(last) n++;
        continue;
      }

      assert.fail(types[type]);
    }

    return BinStr.fromInt(int);
  }

  constructor(bits=[]){
    this.bits = bits;
  }

  get len(){
    return this.length;
  }

  inc(){
    const {bits, len} = this;

    inc: {
      for(let i = 0; i !== len; i++)
        if(bits[i] ^= 1) break inc;

      bits.push(0);
    }

    return this;
  }

  dec(){
    const {bits, len} = this;
    assert(len !== 0);

    dec: {
      for(let i = 0; i !== len; i++)
        if(!(bits[i] ^= 1)) break dec;

      bits.pop();
    }

    return this;
  }

  toInt(){
    return BigInt(`0b1${O.rev(this.toString())}`) - 1n;
  }

  rev(){
    this.bits.reverse();
    return this;
  }

  slice(index=0){
    return new BinStr(this.bits.slice(index));
  }

  concat(other){
    for(const bit of other)
      this.push(bit);

    return this;
  }

  unshift(bit){ this.bits.unshift(bit); return this; }
  push(bit){ this.bits.push(bit); return this; }
  shift(){ return this.bits.shift(); }
  pop(){ return this.bits.pop(); }

  toBuf(){
    return Buffer.from(this.toString());
  }

  toStr(){
    return this.toString();
  }

  toString(){
    return this.bits.join('');
  }

  *[Symbol.iterator](){
    yield* this.bits;
  }
}

module.exports = BinStr;

const cs = require('./ctors');

const {types} = cs;

const {TERM, PAIR} = types;