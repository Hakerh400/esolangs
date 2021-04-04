'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');
const cs = require('./ctors');
const Memory = require('./memory');

const DEBUG = 0;

class Engine{
  constructor(parsed, input){
    this.parsed = parsed;
    this.input = Array.from(input, a => a & 1);
    this.output = null;
  }

  *run(){
    const {parsed: prog, input} = this;
    const {insts} = prog;
    const instsNum = insts.length;

    const mem = new Memory(input);
    let ip = 0;

    while(ip !== instsNum){
      const inst = insts[ip++];

      if(DEBUG){
        log();
        debug(mem.toString(5));
        O.logb();
        log(inst.toString());
      }

      if(inst instanceof cs.Copy){
        yield [[mem, 'copy'], inst.from, inst.to];
        continue;
      }

      if(inst instanceof cs.Comp){
        const eq = yield [[mem, 'cmp'], inst.addr1, inst.addr2];
        if(DEBUG) log(`\n${eq ? 'EQU' : 'NEQ'}`);
        if(!eq && ip !== instsNum) ip++;
        continue;
      }

      if(inst instanceof cs.Jump){
        ip = inst.target;
        continue;
      }

      assert.fail(inst);
    }

    this.output = Buffer.from((yield [[mem, 'getOutput']]).join(''));
  }
  
  getOutput(){
    return this.output;
  }
}

module.exports = Engine;