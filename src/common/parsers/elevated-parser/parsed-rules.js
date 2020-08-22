'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

class ParsedRules{
  constructor(rules, hlInfo){
    this.rules = rules;
    this.hlInfo = hlInfo;
  }
}

module.exports = ParsedRules;