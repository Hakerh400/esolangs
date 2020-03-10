'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const Program = require('./program');

const CHARS = '<>+-,.[]';

const run = (src, input) => {
  src = src.toString().trim();

  if(!/^\d+$/.test(src))
    esolangs.err(`Source code must consist of a single non-negative integer`);

  const targetIndex = BigInt(src);

  if(targetIndex === 0n)
    return Buffer.alloc(0);

  const progsQueue = [];

  let srcsNum = 0n;
  let len = 1n;

  while(1){
    {
      const progsQueueLen = progsQueue.length;
      let i = 0;
      let j = 0;

      for(; i !== progsQueueLen; i++){
        const prog = progsQueue[i];

        if(!prog.isDone){
          prog.tick();
          progsQueue[j++] = prog;
          continue;
        }

        if(++srcsNum === targetIndex)
          return esolangs.run('brainfuck', prog.src, input);
      }

      progsQueue.length = j;
    }

    const num = 1n << (len * 3n);

    for(let i = 0n; i !== num; i++){
      let src = '';

      for(let j = len - 1n; j !== -1n; j--)
        src += CHARS[(i >> (j * 3n)) & 7n];

      const prog = new Program(src);
      if(!prog.isValid) continue;

      progsQueue.push(prog);
    }

    len++;
  }
};

module.exports = run;