'use strict';

const O = require('omikron');
const debug = require('../../common/debug');

class IOBase{
  constructor(machine, input){
    this.machine = machine;
    this.input = input;

    machine.addFunc(this.read.bind(this));
    machine.addFunc(this.write.bind(this));
    machine.addFunc(this.eof.bind(this));
  }

  static name(){}

  read(){}
  write(){}
  eof(){}

  getOutput(){}
};

class IOBit extends IOBase{
  constructor(machine, input){
    super(machine, input);

    this.output = '';
  }

  static name(){ return 'Bit'; }

  read(cbInfo){
    if(!cbInfo.evald) return cbInfo.args;

    if(this.input.length === 0) return;
    var bit = this.input[0] | 0;
    this.input = this.input.substring(1);

    return cbInfo.getIdent(0, bit);
  }

  write(cbInfo){
    if(!cbInfo.evald) return cbInfo.args;

    var arg = cbInfo.getArg(0);
    var bit = arg !== cbInfo.getIdent(0, 0) | 0;
    this.output += String(bit);

    return arg;
  }

  eof(cbInfo){
    if(!cbInfo.evald) return cbInfo.args;

    var eof = this.input.length === 0 | 0;

    return cbInfo.getIdent(0, eof);
  }

  getOutput(){
    return this.output;
  }
};

class IO extends IOBase{
  constructor(machine, input){
    super(machine, Buffer.from(input));

    this.output = Buffer.alloc(1);

    this.inputIndex = 0;
    this.outputIndex = 0;
  }

  static name(){ return 'Standard'; }

  read(cbInfo){
    if(!cbInfo.evald) return cbInfo.args;

    if(this.isEof())
      return;

    var {inputIndex} = this;
    this.inputIndex++;

    var byteIndex = inputIndex >> 3;
    var bitIndex = inputIndex & 7;

    var bit = (this.input[byteIndex] >> bitIndex) & 1;

    return cbInfo.getIdent(0, bit);
  }

  write(cbInfo){
    if(!cbInfo.evald) return cbInfo.args;

    var arg = cbInfo.getArg(0);
    var bit = arg !== cbInfo.getIdent(0, 0);

    var {output, outputIndex} = this;
    this.outputIndex++;

    var byteIndex = outputIndex >> 3;
    var bitIndex = outputIndex & 7;

    if(byteIndex === output.length){
      var buff = Buffer.alloc(output.length);
      this.output = Buffer.concat([output, buff]);
    }

    this.output[byteIndex] |= bit << bitIndex;

    return arg;
  }

  eof(cbInfo){
    if(!cbInfo.evald) return cbInfo.args;
    
    var eof = this.isEof() | 0;

    return cbInfo.getIdent(0, eof);
  }

  isEof(){
    return (this.inputIndex >> 3) === this.input.length;
  }

  getOutput(){
    var len = Math.ceil(this.outputIndex / 8);
    var buff = this.output.slice(0, len);

    return Buffer.from(buff);
  }
};

module.exports = {
  IOBase,
  IOBit,
  IO,
};