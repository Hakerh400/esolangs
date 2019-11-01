'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../omikron');
const SG = require('../../serializable-graph');
const SF = require('../stack-frame');
const cgs = require('.');

class Set extends SG.Node{
  static ptrsNum = this.keys(['arr']);

  constructor(g){
    super(g);
    if(g.dsr) return;

    this.arr = new cgs.Array(g);
  }

  get size(){
    return this.arr.length;
  }

  has(val){
    return this.arr.includes(val);
  }

  add(val){
    for(const elem of this.arr)
      if(elem === val) return this;
    this.arr.push(val);
    return this;
  }

  delete(val){
    const {arr} = this;
    const len = arr.length;

    for(let i = 0; i !== len; i++){
      const elem = arr[i];
      if(elem !== val) continue;

      if(len !== 1) arr[i] = arr[len - 1];
      arr.length = len - 1;

      return 1;
    }

    return 0;
  }

  [Symbol.iterator](){ return this.arr[Symbol.iterator](); }
}

module.exports = Set;