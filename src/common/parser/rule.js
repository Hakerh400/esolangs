'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Section = require('./section');
const Range = require('./range');

class Rule{
  constructor(syntax, pack, name, greediness=1, range=null){
    this.syntax = syntax;
    this.pack = pack;
    this.name = name;
    this.greediness = greediness;
    this.range = range;

    this.sects = O.obj();
  }

  hasRange(){ return this.range !== null; }
  isArr(){ return this.hasRange(); }
  isSingleton(){ return !this.hasRange() || this.range.isSingleton(); }

  hasSect(name){ return name in this.sects; }
  hasMainSect(){ return this.hasSect('main'); }
  addSect(sect){ this.sects[sect.constructor.sectName] = sect; }
  getSect(name){ this.hasSect(name) ? this.sects[name] : null; }

  toString(){ return this.name; }
}

module.exports = Rule;