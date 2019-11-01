'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../omikron');
const SG = require('../../serializable-graph');
const SF = require('../stack-frame');
const cgs = require('.');

class Array extends SG.Node{
  constructor(g, arr=null){
    super(g);
    if(g.dsr) return;

    if(arr !== null)
      for(const val of arr)
        this.push(val);
  }

  static from(g, from){
    const arr = new this(g);
    const len = from.length;

    for(let i = 0; i !== len; i++)
      arr.push(from[i]);

    return arr;
  }

  get length(){ return this.ptrsNum; }

  set length(len){
    const prev = this.ptrsNum;
    const dif = Math.abs(len - prev);

    if(len > prev){
      const {g} = this;
      for(let i = 0; i !== dif; i++)
        this.push(null);
    }else{
      for(let i = 0; i !== dif; i++)
        this.pop();
    }
  }

  unshift(val){
    if(typeof val !== 'object')
      throw new TypeError(`[UNSHIFT] ${getName(val, 1)} is not an object`);

    const len = this.ptrsNum++;
    for(let i = 0; i !== len; i++)
      this[i + 1] = this[i];
    this[0] = val;
    return this.ptrsNum;
  }

  push(val){
    if(typeof val !== 'object')
      throw new TypeError(`[PUSH] ${getName(val, 1)} is not an object`);

    this[this.ptrsNum++] = val;
    return this.ptrsNum;
  }

  shift(){
    const len = this.ptrsNum - 1;
    const val = this[0];
    for(let i = 0; i !== len; i++)
      this[i] = this[i + 1];
    delete this[len];
    this.ptrsNum--;
    return val;
  }

  pop(){
    const len = this.ptrsNum - 1;
    const val = this[len];
    delete this[len];
    this.ptrsNum--;
    return val;
  }

  reverse(){
    const len = this.ptrsNum;
    for(let i = 0, j = len - 1; i < j; i++, j--){
      const temp = this[i];
      this[i] = this[j];
      this[j] = temp;
    }
    return this;
  }

  forEach(func){
    const len = this.ptrsNum;
    for(let i = 0; i !== len; i++)
      func(this[i], i, this);
  }

  map(func){
    const len = this.ptrsNum;
    const arr = new Array(this.g);
    for(let i = 0; i !== len; i++)
      arr[i] = func(this[i], i, this);
    return arr;
  }

  reduce(func, val){
    const len = this.ptrsNum;
    for(let i = 0; i !== len; i++)
      val = func(val, this[i], i, this);
    return val;
  }

  some(func){
    const len = this.ptrsNum;
    for(let i = 0; i !== len; i++)
      if(func(this[i], i, this)) return true;
    return false;
  }

  every(func){
    const len = this.ptrsNum;
    for(let i = 0; i !== len; i++)
      if(!func(this[i], i, this)) return false;
    return true;
  }

  findIndex(func){
    const len = this.ptrsNum;
    for(let i = 0; i !== len; i++)
      if(func(this[i], i, this)) return i;
    return -1;
  }

  find(func){
    const len = this.ptrsNum;
    for(let i = 0; i !== len; i++)
      if(func(this[i], i, this)) return this[i];
  }

  indexOf(val){
    const len = this.ptrsNum;
    for(let i = 0; i !== len; i++)
      if(this[i] === val) return i;
    return -1;
  }

  lastIndexOf(val){
    const len = this.ptrsNum;
    for(let i = len - 1; i !== -1; i--)
      if(this[i] === val) return i;
    return -1;
  }

  includes(val){
    const len = this.ptrsNum;
    for(let i = len - 1; i !== -1; i--)
      if(this[i] === val) return true;
    return false;
  }

  *[Symbol.iterator](){
    const len = this.ptrsNum;
    for(let i = 0; i !== len; i++)
      yield this[i];
  }
}

module.exports = Array;