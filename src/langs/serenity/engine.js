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
    const {parsed: prog, input} = this;

    log([...prog.root.get('stack').get(prog.zero).kvMap.entries()].map(a => a.map(a => a.info || 'obj').join(': ')).join('\n'));

    O.exit();
  }
  
  getOutput(){
    return this.output;
  }
}

module.exports = Engine;