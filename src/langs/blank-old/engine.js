'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');
const cs = require('./ctors');

class Engine{
  constructor(parsed, input){
    this.parsed = parsed;
    this.input = input;
    this.output = null;
  }

  run(){
    const {parsed, input} = this;
    const output = [];

    this.output = Buffer.from(output);
  }
  
  getOutput(){
    return this.output;
  }
}

module.exports = Engine;