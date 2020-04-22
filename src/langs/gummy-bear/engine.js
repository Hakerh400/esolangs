'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const Table = require('@Hakerh400/table');
const esolangs = require('../..');
const debug = require('../../common/debug');
const cs = require('./ctors');

const DEBUG = 0;

class Engine{
  constructor(parsed, input){
    input = input.toString().trim();

    if(!/^[01]*$/.test(input))
      esolangs.err(`Input string can only contain bits`);

    this.parsed = parsed;
    this.input = input;
    this.output = null;
  }

  run(){
    const {parsed: prog, input} = this;
    const {rules} = prog;
    const rulesNum = rules.length;

    let str = `.${input}`;

    let dbgInfo;
    let terminated = 0;

    if(DEBUG){
      dbgInfo = new Table(['Main string', 'Rule applied']);
    }

    mainLoop: while(1){
      for(const rule of rules){
        const {lhs, rhs} = rule;
        const {reg} = lhs;

        if(reg.test(str)){
          if(DEBUG){
            dbgInfo.addRow([str, rule.toString()]);
          }

          if(rhs === null){
            str = str.replace(reg, '');
            terminated = 1;
            break mainLoop;
          }

          str = str.replace(reg, rhs.str);
          continue mainLoop;
        }
      }

      break;
    }

    if(DEBUG){
      if(!terminated) dbgInfo.addRow([str, '/']);
      O.exit(dbgInfo.toString());
    }

    this.output = Buffer.from(str.replace('.', ''));
  }
  
  getOutput(){
    return this.output;
  }
}

module.exports = Engine;