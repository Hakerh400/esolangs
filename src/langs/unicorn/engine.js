'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');
const cs = require('./ctors');

const DEBUG = 0;

class Engine{
  constructor(parsed, input){
    this.parsed = parsed;
    this.input = input;
    this.output = null;
  }

  run(){
    const {parsed: prog, input} = this;
    const {insts} = prog;
    const instsNum = insts.length;

    const vars = [new Variable(String(input)), new Variable()];
    let index = 0;

    while(index !== instsNum){
      const inst = insts[index];
      const {vari, op} = inst;

      if(DEBUG){
        debug(`${
          vars[0].arr.join('')}.${
          vars[1].arr.slice().reverse().join('')}\n${
          inst}`);
      }

      index++;

      if(op.isXor){
        vars[vari].xor();
        continue;
      }

      if(op.isShl){
        vars[vari].shl();
        continue;
      }

      if(op.isShr){
        vars[vari].shr();
        continue;
      }

      if(op.isIf){
        index = vars[vari].last ? op.index1 : op.index2;
        continue;
      }

      assert.fail();
    }

    this.output = vars[1].toBuf();
  }
  
  getOutput(){
    return this.output;
  }
}

class Variable{
  constructor(str=null){
    const arr = [];

    if(str !== null)
      for(const char of O.rev(str))
        arr.push(char | 0, 1);

    this.arr = arr;
  }

  get last(){
    const {arr} = this;
    const len = arr.length;

    if(len === 0) return 0;
    return arr[len - 1];
  }

  xor(){
    const {arr} = this;
    const len = arr.length;

    if(len === 0) arr.push(1);
    else arr[len - 1] ^= 1;
  }

  shl(){
    this.arr.push(0);
  }

  shr(){
    const {arr} = this;

    if(arr.length !== 0) arr.pop();
  }

  toBuf(){
    const io = new O.IOBit();
    let even = 1;

    for(const bit of this.arr){
      if(even ^= 1){
        io.write(bit);
        continue;
      }

      if(bit) continue;
      break;
    }

    return io.getOutput();
  }
}

module.exports = Engine;