'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../omikron');
const SG = require('../serializable-graph');
const SF = require('../stack-frame');
const cgs = require('.');

class Execute extends cgs.Function{
  constructor(g, script, defName){
    super(g, script, 'execute');
    if(g.dsr) return;
    this.defName = defName;
  }

  tick(th){
    const {g, script} = this;
    if(this.nval) return th.call(new g.Parser(g, script, this.defName, 1));
    th.ret(this);
  }
}

module.exports = Execute;