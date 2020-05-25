'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const parser = require('../../common/parser');

const run = (src, input) => {
  const parsedRules = parser.parseRules(src);
  const {hlInfo} = parsedRules;

  const scopes = O.obj();
  const scopeInfoReg = /(#|[a-zA-Z0-9\-_]+(?:\s*,\s*[a-zA-Z0-9\-_]+)*)\s*:\s*(\S+)/g;

  for(const scopeInfo of O.exec(hlInfo.scopesInfo, scopeInfoReg)){
    const names = scopeInfo[1].split(/\s*\,\s*/);
    const color = parseColorInfo(scopeInfo[2]);

    for(const name of names){
      if(name in scopes)
        esolangs.err(`Duplicate definition of scope ${O.sf(name)}`);

      if(name === '#'){
        if(names.length !== 1)
          esolangs.err(`Definition for default scope cannot include other scopes`);

        if(color.includes(null))
          esolangs.err(`Default scope must define both background and foreground colors`);
      }

      scopes[name] = color;
    }
  }

  const ast = {};

  const parsed = parser.parse(parsedRules, input, ast);
  O.exit();

  eng.run();

  return eng.getOutput();
};

const parseColorInfo = str => {
  if(!str.includes('.'))
    return [parseColor(str), null];

  if(str.startsWith('.'))
    return [null, parseColor(str.slice(1))];

  if(str.endsWith('.'))
    return [parseColor(str.slice(1)), null];

  const cols = str.split('.');

  if(cols.length !== 2)
    esolangs.err(`Invalid color info ${O.sf(str)}`);

  return cols.map(a => parseColor(a));
};

const parseColor = str => {
  if(!/^[a-fA-F0-9]{6}$/.test(str))
    esolangs.err(`Invalid color ${O.sf(str)}`);

  return str.toLowerCase();
};

module.exports = run;