'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
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
  Object.assign(Compiler.prototype, rules);

  const ctors = {Parser, Compiler, Interpreter};
  for(const ctroName in ctors)
    Object.assign(ctors[ctroName], ctors);

  const lang = new PL('', syntaxObj, Parser, Compiler, Interpreter);
  const eng = new Engine(lang, String(script), 1e8, 1e8 - 1e3);
  let err = 0;

  eng.stderr.on('write', (buf, len) => {
    log(buf.toString());
    err = 1;
  });

  eng.run();

  if(err) return null;
  return eng.getRetVal();
};

module.exports = {
  parse,
};