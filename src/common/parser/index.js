'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const esolangs = require('../..');
const Engine = require('./engine');
const Syntax = require('./syntax');
const PL = require('./programming-language');
const ParserBase = require('./parser-base');
const CompilerBase = require('./compiler-base');
const InterpreterBase = require('./interpreter-base');

const parse = (syntax, script, rules) => {
  const syntaxObj = Syntax.fromStr(String(syntax));

  class Parser extends ParserBase{}
  class Compiler extends CompilerBase{}
  class Interpreter extends InterpreterBase{}

  for(const ruleName of O.keys(rules))
    Compiler.prototype[`[${ruleName}]`] = rules[ruleName];

  const ctors = {Parser, Compiler, Interpreter};
  for(const ctroName in ctors)
    Object.assign(ctors[ctroName], ctors);

  const lang = new PL('', syntaxObj, Parser, Compiler, Interpreter);
  const eng = new Engine(lang, String(script), 1e8, 1e8 - 1e3);
  let err = 0;

  eng.stderr.on('write', (buf, len) => {
    esolangs.err(buf.toString());
    err = 1;
  });

  eng.run();

  if(err) return null;
  return eng.getRetVal();
};

module.exports = {
  parse,
};