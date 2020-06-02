'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../../..');
const cs = require('.');

const {Base} = cs;

class SolutionStructure extends Base{
  type = 2;
  arr = null;
  
  constructor(system, data){
    super();

    this.system = system;
    this.data = data;
  }

  finalize(type, arr){
    this.type = type;
    this.arr = arr;
  }

  toExpr(){
    const {system} = this;
    const map = new Map();

    this.bottomUp(sStruct => {
      switch(sStruct.type){
        case 0:
          map.set(sStruct, sStruct.data);
          break;

        case 1:
          map.set(sStruct, new cs.Pair(
            system,
            map.get(sStruct.arr[0]),
            map.get(sStruct.arr[1]),
          ));
          break;

        default:
          assert.fail(sStruct.type);
          break;
      }
    });

    return map.get(this);
  }

  get chNum(){ return this.arr.length; }
  getCh(i){ return this.arr[i]; }
}

const ctors = {
  SolutionStructure,
};

Object.assign(cs, ctors);
module.exports = cs;