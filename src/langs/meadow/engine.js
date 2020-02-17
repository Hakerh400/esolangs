'use strict';

const fs = require('fs');
const path = require('path');
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
    const output = [];

    // const mainFunc = prog.getaFunc('main');
    // const bitType = prog.getaType('Bit', '*');
    // const bit0Type = prog.getaType('Bit0', 'Bit');
    // const bit1Type = prog.getaType('Bit1', 'Bit');
    // const stringType = prog.getaType('String', '*');
    // const emptyStringType = prog.getaType('EmptyString', 'String');
    // const nonEmptyStringType = prog.getaType('NonEmptyString', 'String');

    // let expr = mainFunc.expr;

    this.output = Buffer.from(output);
  }
  
  getOutput(){
    return this.output;
  }
}

class Structure{
  constructor(type, attribs=O.obj()){
    this.type = type;
    this.attribs = attribs;
  }
}

module.exports = Engine;