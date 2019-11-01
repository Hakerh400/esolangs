'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../omikron');
const SG = require('../../serializable-graph');
const SF = require('../stack-frame');
const cgs = require('.');

class Execute extends cgs.Function{
  constructor(g, script){
    super(g, script, new cgs.String(g, 'execute'));
    if(g.dsr) return;
  }

  tick(th){
    const {g, script} = this;
    if(this.nval) return th.call(new g.Parser(g, script, 1));
    th.ret(this);
  }
}

module.exports = Execute;