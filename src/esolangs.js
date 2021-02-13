'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const packageJson = require('../package');
const langsList = require('./langs-list');
const commonStrs = require('./common-strs');
const Sandbox = require('./sandbox');
const ProgramError = require('./program-error');

const langsObj = O.obj();
const langsIdsObj = O.obj();

for(const info of langsList){
  langsObj[info.name] = info;
  langsIdsObj[info.id] = info;
}

const cwd = __dirname;
const langsDir = path.join(cwd, 'langs');
const hwProgsDir = path.join(cwd, 'hw-progs');

const esolangs = {
  version: packageJson.version,
  debugMode: 0,

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

  async run(name, src, inputBuf=null, opts=O.obj()){
    const info = esolangs.getInfo(name);

    if(info === null)
      esolangs.err(`Unsupported language ${O.sf(name)}`);

    if(!this.debugMode && O.has(info, 'wip') && info.wip)
      esolangs.err(`Language ${O.sf(name)} is still a work-in-progress`);

    const hasInput = inputBuf !== null;
    const outputOnly = O.has(info, 'outputOnly') && info.outputOnly;

    inputBuf = Buffer.from(inputBuf);

    if(hasInput && outputOnly)
      esolangs.err(`Language ${O.sf(name)} is an output-only language and does not take input ` +
        `(parameter \`input\` must be null)`);

    if(!hasInput && !outputOnly)
      esolangs.err(`Language ${O.sf(name)} is not an output-only language and must take input ` +
        `(parameter \`input\` cannot be null)`);

    let input = null;

    formatInput: if(hasInput){
      const expectedFormat = info.inputFormat || 'byte-array';
      const actualFormat = opts.inputFormat || 'byte-array';

      // if(actualFormat === expectedFormat){
      //   input = inputBuf;
      //   break formatInput;
      // }

      const encoded = await encoding.encode(inputBuf, actualFormat);
      if(encoded !== null) input = await encoding.decode(encoded, expectedFormat);

      if(input === null)
        esolangs.err(`Input string is not properly encoded using ${O.sf(actualFormat)} encoding`);
    }

    const pth = path.join(langsDir, info.id);
    const func = await require(pth);

    if(hasInput || outputOnly){
      assert(Buffer.isBuffer(input));

      const outputBuf = await func(Buffer.from(src), input, opts);
      assert(Buffer.isBuffer(outputBuf));

      let output = null;

      formatOutput: {
        const expectedFormat = opts.outputFormat || 'byte-array';
        const actualFormat = info.outputFormat || 'byte-array';

        // if(actualFormat === expectedFormat){
        //   output = outputBuf;
        //   break formatOutput;
        // }

        const encoded = await encoding.encode(outputBuf, actualFormat);
        assert(encoded !== null);

        output = await encoding.decode(encoded, expectedFormat);
        assert(output !== null);
      }

      assert(Buffer.isBuffer(output));
      return output;
    }

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

  // This method can be used in a browser to control bandwidth
  async preload(name){
    const info = esolangs.getInfo(name);
    assert(info !== null);

    const pth = path.join(langsDir, info.id);
    const func = await require(pth);
  },

  getStrs(){
    return commonStrs.names.slice();
  },

  getStr(name){
    const {strs} = commonStrs;
    if(!(name in strs)) return null;
    return strs[name];
  },

  async getHwProg(name){
    const info = esolangs.getInfo(name);
    if(info.wip || info.hwProg === false) return null;

    const {id} = info;
    const file = path.join(hwProgsDir, `${id}.txt`);

    return O.rfs(file);
  },

  /*
    If interpreter is unable to proceed and does not know what to do,
    it should call this method, since it should not give a wrong result or
    throw an error for a valid program.
  */
  loop(reason=null){
    if(this.debugMode){
      log(`WARNING: The interpreter cannot proceed`);
      if(reason !== null) log(`Reason: ${reason}`);
      O.exit();
    }
    
    for(;;);
  },

  err(msg){
    if(this.debugMode || cli.isInvoked) O.error(msg);
    throw new ProgramError(msg);
  },
};

module.exports = Object.assign(esolangs, {
  ProgramError,
});

const cli = require('./cli');
const encoding = require('./encoding');