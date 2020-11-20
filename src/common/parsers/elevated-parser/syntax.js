'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const SG = require('./serializable-graph');
const Rule = require('./rule');
const Section = require('./section');
const Pattern = require('./pattern');
const Element = require('./element');
const Range = require('./range');
const Context = require('./context');
const ruleParser = require('./rule-parser');
const ParsedRules = require('./parsed-rules');
const AST = require('./ast');

const FILE_EXTENSION = 'txt';

class Syntax{
  constructor(parsedRules){
    assert(parsedRules instanceof ParsedRules);
    this.defs = parsedRules.rules;
  }

  static fromStr(str){
    return new Syntax(ruleParser.parse(str));
  }

  static fromParsedRules(parsedRules){
    return new Syntax(parsedRules);
  }
}

module.exports = Object.assign(Syntax, {
  Rule,
  Section,
  Pattern,
  Element,
  Range,
  Context,
});