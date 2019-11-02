'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const ns = require('./nodes');

const rules = {
  ['[script]'](e){
    O.exit(e.fst.fst);
    const mainBlock = new ns.Block(null, e.es[1]);
  },

  ['[insts]'](e){
    return e.es[1].arr;
  },

  ['[inst]'](e){
    return e + '';
  },
};

module.exports = rules;