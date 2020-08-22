'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const parser = require('../../common/parsers/elevated-parser');
const ast = require('./ast');
const Engine = require('./engine');
const cs = require('./ctors');

const cwd = __dirname;
const syntax = O.rfs(path.join(cwd, 'syntax.txt'), 1);

const run = (src, input) => {
  // Transform unicode identifiers
  {
    const idents = O.obj();
    let identsNum = 0;

    const chars1 = `[a-zA-Z0-9\\x5F]`;
    const chars2 = `[^\\x00-\\xFF]`;
    const chars = `(?:${chars1}|${chars2})`;
    const case1 = `\\x5F${chars}*`;
    const case2 = `${chars}*${chars2}${chars}*`;
    const reg = new RegExp(`(?:^|(?<!${chars}))(?:${case1}|${case2})(?:(?!${chars})|$)`, 'g');

    src = src.toString().replace(reg, ident => {
      if(ident in idents)
        return idents[ident];

      return idents[ident] = `\x5F${identsNum++}`;
    });
  }

  const parsed = parser.parse(syntax, src, ast);
  const eng = new Engine(parsed, Buffer.from(input));
  
  eng.run();

  return eng.getOutput();
};

module.exports = run;