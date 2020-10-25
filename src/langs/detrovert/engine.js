'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const List = require('@hakerh400/list');
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
    const {patterns} = prog;
    const pnum = patterns.length;

    const tString = prog.getNative('String');
    const tBit0 = prog.getNative('Bit0');
    const tBit1 = prog.getNative('Bit1');

    const mainStr = tString.new();

    {
      let bit = null;

      for(let i = input.length - 1; i !== -1; i--)
        bit = (input[i] === '0' ? tBit0 : tBit1).new({next: bit});

      mainStr.set('bit', bit);
    }

    const threads = new List.ArrayList();
    threads.push(new cs.Thread(mainStr));

    while(!threads.isEmpty){
      const thread = threads.shift();
      const {obj} = thread;

      for(let i = pnum - 1; i !== -1; i--)
        if(patterns[i].transform(threads, obj)) break;
    }

    {
      let str = '';

      for(let bit = mainStr.get('bit'); bit !== null; bit = bit.get('next'))
        str += bit.exts(tBit0) ? '0' : '1';

      this.output = Buffer.from(str);
    }
  }
  
  getOutput(){
    return this.output;
  }
}

module.exports = Engine;