'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const packageJson = require('../package');
const langsList = require('./langs-list');
const commonStrs = require('./common-strs');

const langsObj = O.obj();
const langsIdsObj = O.obj();

for(const info of langsList){
  langsObj[info.name] = info;
  langsIdsObj[info.id] = info;
}

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

  getInfoById(id){
    if(!(id in langsIdsObj)) return null;
    return langsIdsObj[id];
  },

  run(name, src, input){
    const info = esolangs.getInfo(name);
    if(info === null) throw new TypeError(`Unsupported language ${O.sf(name)}`);

    const func = require(path.join(langsDir, info.id));
    const output = func(Buffer.from(src), Buffer.from(input));

    return output;
  },

  getStrs(){
    return commonStrs.names.slice();
  },

  getStr(name){
    const {strs} = commonStrs;
    if(!(name in strs)) return null;
    return strs[name];
  },
};

module.exports = esolangs;