'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const crypto = require('crypto');
const esolangs = require('../..');
const calcHash = require('../../common/hash');

const run = (src, input) => {
  const hash = calcHash(src, 'sha512');

  for(let i = 0; i !== 4; i++)
    if(hash[i] !== 0)
      esolangs.err(`SHA-512 of the source code must start with 4 zero bytes\n\n${
        hash.toString('hex')}`);

  return esolangs.run('brainfuck', src, input);
};

module.exports = run;