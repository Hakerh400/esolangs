'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const Parser = require('../../common/parsers/lisparser');
const debug = require('../../common/debug');

const run = (src, input) => {
  const top = Parser.parse(src);
  const mem = O.obj();
  let ip = 0n;

  input = [...input];
  const output = [];

  const exec = function*(list, loop=1){
    const elems = loop ? list.ta('loop') : list.a();

    while(!loop || mem[ip]){
      for(const elem of elems){
        const {fst} = elem;
        const type = fst.m;
        if(type !== 'loop') elem.uni;

        switch(type){
          case 'left': ip--; break;
          case 'right': ip++; break;
          case 'inc': mem[ip] = -~mem[ip] & 255; break;
          case 'dec': mem[ip] = ~-mem[ip] & 255; break;
          case 'in': mem[ip] = input.shift() & 255; break;
          case 'out': output.push(mem[ip]); break;
          case 'loop': yield [exec, elem]; break;
          default: fst.err(`Unknown instruction`); break;
        }
      }

      if(!loop) break;
    }
  };

  O.rec(exec, top, 0);

  return Buffer.from(output);
};

module.exports = run;