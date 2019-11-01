'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../omikron');
const SG = require('../../serializable-graph');
const SF = require('../stack-frame');
const cgs = require('.');

class Object extends SG.Node{
  static ptrsNum = this.keys(['arr']);

  constructor(g){
    super(g);
    if(g.dsr) return;

    this.arr = new cgs.Array(g);
  }

  static from(g, from){
    const obj = new this(g);

    for(const key of O.keys(from))
      obj.set(key, from[key]);

    return obj;
  }

  get size(){
    return this.arr.length;
  }

  has(key){
    for(const elem of this.arr)
      if(elem[0].str === key) return true;
    return false;
  }

  get(key, val){
    for(const elem of this.arr)
      if(elem[0].str === key) return elem[1];
  }

  set(key, val){
    for(const elem of this.arr){
      if(elem[0].str === key){
        elem[1] = val;
        return this;
      }
    }
    key = new cgs.String(this.g, key);
    this.arr.push(new cgs.Array(this.g, [key, val]));
    return this;
  }

  delete(key){
    const {arr} = this;
    const len = arr.length;

    for(let i = 0; i !== len; i++){
      const elem = arr[i];
      if(elem[0].str !== key) continue;

      if(len !== 1) arr[i] = arr[len - 1];
      arr.length = len - 1;

      return true;
    }

    return false;
  }

  *[Symbol.iterator](){
    for(const [{str}, val] of this.arr)
      yield [str, val];
  }
}

module.exports = Object;