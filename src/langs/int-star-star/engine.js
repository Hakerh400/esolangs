'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

class Engine{
  constructor(parsed, input){
    this.parsed = parsed;
    this.input = input;
    this.output = null;
  }

  run(){
    const {parsed: prog, input} = this;

    log(prog.toString());

    this.output = Buffer.alloc(0);
  }
  
  getOutput(){
    return this.output;
  }
}

module.exports = Engine;