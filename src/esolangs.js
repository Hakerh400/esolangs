'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const packageJson = require('../package');
const langsList = require('./langs-list');

const langsObj = O.obj();

for(const info of langsList)
  langsObj[info.name] = info;

const cwd = __dirname;
const langsDir = path.join(cwd, 'langs');

const esolangs = {
  version: `v${packageJson.version}`,

  getLangs(){
    return langsList.map(a => a.name);
  },

  getInfo(name){
    if(!(name in langsObj)) return null;
    return langsObj[name];
  },

  run(name, src, input){
    const info = esolangs.getInfo(name);
    if(info === null) throw new TypeError(`Unsupported language ${O.sf(name)}`);

    const func = require(path.join(langsDir, info.id));
    const output = func(Buffer.from(src), Buffer.from(input));

    return output;
  },
};

module.exports = esolangs;