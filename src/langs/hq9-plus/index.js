'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

const run = (src, input) => {
  src = src.toString();

  let output = '';

  for(const c of src){
    switch(c){
      case 'H': output += esolangs.getStr('hello-world'); break;
      case 'Q': output += src; break;
      case '9': output += esolangs.getStr('99-bottles'); break;
    }
  }

  return Buffer.from(output);
};

module.exports = run;