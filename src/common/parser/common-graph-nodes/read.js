'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../omikron');
const SG = require('../../serializable-graph');
const SF = require('../stack-frame');
const cgs = require('.');

class Read extends SF{
  constructor(g, len){
    super(g);
    if(g.dsr) return;

    this.len = len;
    this.buf = null;
  }

  ser(s){
    super.ser(s);
    ser.writeUint(len);
    if(this.buf !== null) ser.write(1).writeBuf(this.buf);
    else ser.write(0);
  }

  deser(s){
    super.deser(s);
    this.len = ser.readUint();
    if(ser.read()) this.buf = ser.readBuf();
    else this.buf = null;
  }

  tick(th){
    this.buf = this.g.stdin.read(this.len);
    if(this.buf === null) return;
    th.ret(this);
  }
}

module.exports = Read;