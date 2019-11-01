'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../omikron');
const SG = require('../../serializable-graph');
const SF = require('../stack-frame');
const cgs = require('.');

class Function extends SF{
  static ptrsNum = this.keys(['script', 'funcName', 'funcPrev']);

  constructor(g, script=null, funcName=null, sf=null){
    super(g, sf);
    if(g.dsr) return;

    this.script = script;
    this.funcName = funcName;
    this.funcPrev = null;
  }

  get isFunc(){ return 1; }
}

module.exports = Function;