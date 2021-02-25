'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');
const parser = require('./parser');

const DEBUG = 0;

const run = (src, input) => {
  const prog = parser.parse(src.toString());
  const io = new O.IOBit(input);

  const read = () => {
    const bit = io.read();

    if(DEBUG)
      debug(`---> IN ${bit}`);

    return bit;
  };

  const write = bit => {
    if(DEBUG)
      debug(`---> OUT ${bit}`);

    io.write(bit);
  };

  const exec = function*(insts, stack){
    const push = bit => {
      stack.push(bit);
    };

    const pop = () => {
      if(stack.length === 0)
        return 0;

      return stack.pop();
    };

    const len = insts.length;

    for(let i = 0; i !== len; i++){
      const inst = insts[i];

      if(typeof inst === 'number'){
        if(inst === 0){
          push(0);
          continue;
        }

        if(inst === 1){
          push(pop() ^ 1);
          continue;
        }

        if(inst === 2){
          const mode = pop();

          if(mode === 0){
            push(read());
          }else{
            write(pop());
          }

          continue;
        }

        assert.fail();
      }

      const [type, insts1] = inst;

      if(type === 0){
        while(pop())
          yield [exec, insts1, stack];

        continue;
      }

      if(type === 1){
        esolangs.err(`Instruction () is not implemented yet`);
        continue;
      }

      assert.fail();
    }
  };

  O.rec(exec, prog, []);

  return io.getOutput();
};

module.exports = run;