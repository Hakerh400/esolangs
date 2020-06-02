'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../../..');
const cs = require('.');

const {Base} = cs;

class TemporaryStructure extends Base{
  constructor(type, data){
    super();

    this.type = type;
    this.data = data;

    const arr = [];

    switch(type){
      case 0: case 2: break;

      case 1:
        arr.push(data[0], data[1]);
        break;

      case 3:
        arr.push(data[1]);
        break;

      default: assert.fail(type); break;
    }

    this.arr = arr;
  }

  get chNum(){ return this.arr.length; }
  getCh(i){ return this.arr[i]; }
}

const ctors = {
  TemporaryStructure,
};

Object.assign(cs, ctors);
module.exports = cs;