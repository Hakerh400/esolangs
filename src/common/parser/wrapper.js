'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const SG = require('../serializable-graph');
const SF = require('./stack-frame');

class Wrapper extends SG.Node{
  constructor(g, v=null){
    super(g);
    if(g.dsr) return;

    this.v = v;
  }
}

module.exports = Wrapper;