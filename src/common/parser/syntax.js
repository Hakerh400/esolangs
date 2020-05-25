'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const SG = require('../serializable-graph');
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

  // static fromDir(dir){
  //   dir = path.normalize(dir);
  //
  //   const dirs = [dir];
  //   let str = '';
  //
  //   while(dirs.length !== 0){
  //     const d = dirs.shift();
  //
  //     const names = O.sortAsc(fs.readdirSync(d).filter(name => {
  //       return O.ext(name) === FILE_EXTENSION;
  //     }));
  //
  //     for(const name of names){
  //       const file = path.join(d, name);
  //       const stat = fs.statSync(file);
  //
  //       if(stat.isDirectory()){
  //         dirs.push(file);
  //         continue;
  //       }
  //
  //       if(!stat.isFile())
  //         throw new TypeError(`Unsupported file system entry ${O.sf(file)}`);
  //
  //       const pack = path.relative(dir, file)
  //         .replace(/\.[a-z0-9]+$/i, '')
  //         .replace(/[\/\\]/g, '.')
  //         .replace(/\-./g, a => a[1].toUpperCase());
  //
  //       const src = O.rfs(file, 1);
  //       str = `${str}\n#package{${pack}}\n${src}`;
  //     }
  //   }
  //
  //   return new Syntax(str);
  // }
}

module.exports = Object.assign(Syntax, {
  Rule,
  Section,
  Pattern,
  Element,
  Range,
  Context,
});