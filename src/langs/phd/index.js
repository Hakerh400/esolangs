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

  const sizeMap = new Map();

  const getSize = insts => {
    if(!sizeMap.has(insts))
      sizeMap.set(insts, O.rec(calcSize, insts));

    return sizeMap.get(insts);
  };

  const calcSize = function*(insts){
    let size = insts.length;

    for(const inst of insts){
      if(typeof inst === 'number')
        continue;

      size += yield [calcSize, inst[1]];
    }

    return size;
  };

  const exec = function*(insts, stack, test=null){
    const len = insts.length;

    const push = bit => {
      if(stack.length === 0 && !bit)
        return;

      stack.push(bit);
    };

    const pop = () => {
      if(stack.length === 0)
        return 0;

      return stack.pop();
    };

    const getSnapshot = () => {
      assert(test);
      return [...test.pth, ...stack.slice(-test.size)];
    };

    if(test) test.pth.push(0);

    for(let i = 0; i !== len; i++){
      if(test){
        if(!test.halts) break;

        O.setLast(test.pth, i);

        const snapshot = getSnapshot();

        if(test.map.has(snapshot)){
          test.halts = 0;
          break;
        }

        test.map.set(snapshot, 1);
      }

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
          yield [exec, insts1, stack, test];

        continue;
      }

      if(type === 1){
        const test = {
          size: getSize(insts1),
          map: new O.MultidimensionalMap(),
          pth: [],
          halts: 1,
        };

        yield [exec, insts1, stack.slice(), test];
        if(test.halts) push(0);

        continue;
      }

      assert.fail();
    }

    if(test) test.pth.pop();
  };

  O.rec(exec, prog, []);

  return io.getOutput();
};

module.exports = run;