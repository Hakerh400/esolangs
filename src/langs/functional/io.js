'use strict';

const O = require('omikron');
const debug = require('../../common/debug');

class IO{
  constructor(machine, input){
    this.machine = machine;
    this.io = new O.IOBit(input, 0);

    machine.addFunc(this.read.bind(this));
    machine.addFunc(this.write.bind(this));
    machine.addFunc(this.eof.bind(this));
  }

  read(cbInfo){
    if(!cbInfo.evald) return cbInfo.args;

    if(this.isEof())
      return;

    const bit = this.io.read();
    return cbInfo.getIdent(0, bit);
  }

  write(cbInfo){
    if(!cbInfo.evald) return cbInfo.args;

    const arg = cbInfo.getArg(0);
    const bit = arg !== cbInfo.getIdent(0, 0);

    this.io.write(bit);

    return arg;
  }

  eof(cbInfo){
    if(!cbInfo.evald) return cbInfo.args;
    
    const eof = this.isEof() | 0;
    return cbInfo.getIdent(0, eof);
  }

  isEof(){
    return !this.io.hasMore;
  }

  getOutput(){
    return this.io.getOutput();
  }
};

module.exports = IO;