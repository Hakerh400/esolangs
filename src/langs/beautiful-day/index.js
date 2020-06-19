'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');

const noSolMsg = 'No solution exists.';

const run = (src, input) => {
  const inputStrs = O.sanl(String(input).trim());

  if(inputStrs.length !== 2)
    esolangs.err(`Input must consist of two strings separated by a new line`);

  inputs.forEach((str, index) => {
    if(!/^[!-~]*$/.test(str))
      esolangs.err(`The ${
        index === 0 ? 'first' : 'second'} input string ${
        O.sf(str)} contains invalid characters`);
  });

  const noSol = () => {
    const msg = inputStrs.every(a => a === noSolMsg) ?
      `${noSolMsg.slice(0, noSolMsg.length - 1)}!` : noSolMsg;

    return Buffer.from(msg);
  };

  const srcCode = String(src).trim();

  if(srcCode.length === 0)
    esolangs.err(`Source code must contain at least one function definition`);

  const funcArgsNum = O.obj();
  const funcDefStrs = srcCode.split(/\s*;\s*/);

  funcDefStrs.pop();

  funcDefStrs.forEach((funcDefStr, index) => {
    const parts = funcDefStr.split(/\s*=\s*/);

    if(parts.length !== 2)
      esolangs.err(`Function definition ${O.sf(funcDefStr)} must contain exactly one colon`);

    const [lhs, rhs] = parts.map(str => {
      const tokens = O.match(/[a-zA-Z0-9_]+|"(?:(?![\\"])[!-~]|\\.)"|[\.\?#]/gs);

      if(tokens.join('').replace(/\s+/g, '') !== str.replace(/\s+/g, ''))
        esolangs.err(`Invalid function definition ${O.sf(funcDefStr)}`);
    });

    if(lhs.length === 0)
      esolangs.err(`Missing function name in function definition ${O.sf(funcDefStr)}`);

    const name = lhs.shift();
    const argsNum = lhs.length;

    if(!(name in funcArgsNum)){
      funcArgsNum[name] = argsNum;
    }else{
      if(funcArgsNum[name] !== argsNum)
        esolangs.err(`Two definitions of function ${O.sf(name)} have different number of arguments`);
    }

    const argNames = new Set();

    for(const argName of lhs){
      if(argNames.has(argName))
        esolangs.err(`Function ${O.sf(name)} has duplicate argument names ${O.sf(argName)}`);

      argNames.add(argName);
    }

    funcDefStrs[index] = [lhs, rhs];
  });


};

module.exports = run;