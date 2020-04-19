'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const packageJson = require('../package');
const langsList = require('./langs-list');
const commonStrs = require('./common-strs');
const Sandbox = require('./sandbox');

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
  debugMode: false,

  Sandbox,

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

  run(name, src, input=null, opts=null){
    const info = esolangs.getInfo(name);

    if(info === null)
      esolangs.err(`Unsupported language ${O.sf(name)}`);

    if(!this.debugMode && O.has(info, 'wip') && info.wip)
      esolangs.err(`Language ${O.sf(name)} is still a work-in-progress`);

    const hasInput = input !== null;
    const outputOnly = O.has(info, 'outputOnly') && info.outputOnly;

    if(hasInput && outputOnly)
      esolangs.err(`Language ${O.sf(name)} is an output-only language and does not take input ` +
        `(parameter \`input\` must be null)`);

    if(!hasInput && !outputOnly)
      esolangs.err(`Language ${O.sf(name)} is not an output-only language and must take input ` +
        `(parameter \`input\` cannot be null)`);

    const func = require(path.join(langsDir, info.id));

    if(hasInput){
      const result = func(Buffer.from(src), Buffer.from(input), opts);
      return result;
    }

    src = Buffer.from(src);

    if(outputOnly)
      return func(src, null, opts);

    if(!('interactive' in info && info.interactive))
      esolangs.err(`Language ${O.sf(name)} does not support interactive mode`);

    func(src, null, opts);
  },

  async runSafe(name, src, input, opts=null, sbxOpts=null){
    const sandbox = new Sandbox();
    const result = await sandbox.run(name, src, input, opts, sbxOpts);
    sandbox.dispose();
    return result;
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
    if(this.debugMode || isCLIInvoked) O.error(msg);
    throw new Error(msg);
  },
};

module.exports = esolangs;

const cli = require('./cli');
const isCLIInvoked = cli.isInvoked();