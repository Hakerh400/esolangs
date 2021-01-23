'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

const run = async (src, input) => {
  src = src.toString().trim().
    replace(/[ \t]|\/\/[^\r\n]*|\/\*[\s\S]*?\*\//g, '');

  if(src === '')
    return Buffer.alloc(0);

  const idents = O.obj();
  let identsNum = 0;

  for(const ident of O.exec(src, /[a-zA-Z_]+/g))
    if(!(ident in idents))
      idents[ident] = identsNum++;

  if(identsNum !== 0){
    const max = identsNum - 2;

    src = src.replace(/[a-zA-Z_]+/g, ident => {
      const index = idents[ident];
      if(index === 0) return '0';
      if(max === 0) return '1';

      const num = index - 1;
      let mask = 1 << 31 - Math.clz32(max);
      let limit = 1;
      let bits = '1';

      while(mask !== 0){
        if(!limit || (max & mask)){
          let bit = num & mask ? 1 : 0;
          bits += bit;
          if(!bit) limit = 0;
        }

        mask >>= 1;
      }

      return bits;
    });
  }

  const lhsArr = [];
  const rhsArr = [];

  const getPrefixIndex = lhs => {
    const index = lhsArr.findIndex(a => a.startsWith(lhs) || lhs.startsWith(a));
    if(index === -1) return null;
    return index;
  };

  const hasPrefix = lhs => {
    return getPrefixIndex(lhs) !== null;
  };

  const addLhs = (lhs, rhs, ctx=null) => {
    const index = getPrefixIndex(lhs);

    if(index !== null){
      assert(ctx !== null);
      esolangs.err(`Conflicting rule definitions:\n\n${
        lhsArr[index]} - ${rhsArr[index]}\n${lhs} - ${rhs}`);
    }

    lhsArr.push(lhs);
    rhsArr.push(rhs);
  };

  for(const rule of O.sanl(src)){
    if(rule.length === 0) continue;

    const err = msg => {
      esolangs.err(`Rule ${O.sf(rule)} ${msg}`);
    };

    if(!rule.includes('-'))
      err(`must contain "-" character`);

    const parts = rule.split('-');

    if(parts.length !== 2)
      err(`cannot have multiple "-" characters`);

    const [lhs, rhs] = parts;

    if(lhs === '/'){
      addLhs('', rhs, rule);
      continue;
    }

    if(!/^[01]*#?$/.test(lhs))
      err(`has invalid left side`);

    addLhs(lhs, rhs, rule);
  }

  assert(lhsArr.length !== 0);

  for(const lhs of lhsArr){
    for(let i = 0; i !== lhs.length; i++){
      const prefix = lhs.slice(0, i);

      for(const suffix of '01#'){
        const lhs = prefix + suffix;

        if(!hasPrefix(lhs))
          addLhs(lhs, '/');
      }
    }
  }

  src = lhsArr.map((lhs, index) => {
    return `${lhs} - ${rhsArr[index]}`;
  }).join('\n');

  return await esolangs.run('Golden sunrise', src, input, {
    useBitIO: 1,
    inputFormat: 'padded-bit-array',
    outputFormat: 'padded-bit-array',
  });
};

module.exports = run;