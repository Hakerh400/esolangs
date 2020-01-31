'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const packageJson = require('../package');
const langsList = require('./langs-list');
const commonStrs = require('./common-strs');

const DEBUG = 0;

const langsObj = O.obj();
const langsIdsObj = O.obj();

for(const info of langsList){
  langsObj[info.name] = info;
  langsIdsObj[info.id] = info;
}

const cwd = __dirname;
const langsDir = path.join(cwd, 'langs');

const esolangs = {
  version: packageJson.version,

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

    if(info === null)
      esolangs.err(`Unsupported language ${O.sf(name)}`);

    if(O.has(info, 'wip') && info.wip)
      esolangs.err(`Language ${O.sf(name)} is still a work-in-progress`);

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

  /*
    If interpreter is unable to proceed and does not know what to do,
    it should call this method, since it should not give a wrong result or
    throw an error for a valid program.
  */
  loop(reason){
    log(`WARNING: The interpreter cannot proceed`);
    log(`Reason: ${reason}`);
    for(;;);
  },

  err(msg){
    if(DEBUG || isCLIInvoked) O.error(msg);
    throw new Error(msg);
  },
};

module.exports = esolangs;

const cli = require('./cli');
const isCLIInvoked = cli.isInvoked();