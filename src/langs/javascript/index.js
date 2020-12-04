'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

const run = (src, input) => {
  try{
    let output = [];

    const process = {
      stdout: {
        write(a){
          output.push(Buffer.from(a));
        },
      },
    };

    const console = {
      log(...a){
        process.stdout.write(`${a.map(a => String(a)).join(' ')}\n`);
      },
    };

    const func = new Function('process', 'console', 'input', src.toString());
    func(process, console, input);

    return Buffer.concat(output);
  }catch(err){
    esolangs.err(err);
  }
};

module.exports = run;