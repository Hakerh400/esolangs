'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Range = require('./range');

class RangeSet{
  constructor(range=null){
    this.ranges = [];

    if(range !== null) this.add(range);
  }

  get size(){ return this.ranges.length; }

  add(range){ this.ranges.push(range); }
  has(num){ return this.ranges.some(r => r.has(num)); }
  overlaps(range){ return this.ranges.some(r => r.overlaps(range)); }
  isEmpty(){ return this.ranges.length === 0; }

  invert(){
    const {ranges} = this;
    const rangesNew = [];
    let range = null;

    for(let i = 0; i !== 256; i++){
      const has = !ranges.some(r => r.has(i));

      if(range === null){
        if(has) range = new Range(i);
      }else{
        if(!has){
          range.end = i - 1;
          rangesNew.push(range);
          range = null;
        }
      }
    }

    if(range !== null){
      range.end = 255;
      rangesNew.push(range);
    }

    this.ranges = rangesNew;
    return this;
  }
}

module.exports = RangeSet;