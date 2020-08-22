'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Element = require('./element');

class Pattern{
  constructor(){
    this.elems = [];
  }

  addElem(elem){ this.elems.push(elem); }
  len(){ this.elems.length; }

  toString(){ return '(pattern)'; }
}

module.exports = Pattern;