'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');
const parser = require('./parser');
const Queue = require('./queue');
const cs = require('./ctors');

const DEBUG = 0;
const TRANSITION_PRI = 10;

const run = (src, input) => {
  if(DEBUG) O.bion(1);

  const prog = parser.parse(src.toString());
  const {cmds} = prog;

  if(DEBUG){
    log(prog.toString());
    log();
  }

  const queue = O.rec([prog, 'initQueue'], input);

  while(!queue.isEmpty){
    if(!queue.hasStates)
      for(const elem of queue)
        elem.pri = TRANSITION_PRI;

    const elem = queue.shift();

    if(elem instanceof cs.State){
      const state = elem;
      const {ip, vars, io} = state;

      if(ip === cmds.length)
        return io.output;

      const cmd = cmds[ip];
      state.ip++;

      O.rec([cmd, 'exec'], queue, state);

      continue;
    }

    if(elem instanceof cs.Transition){
      const tran = elem;

      if(tran.pri !== TRANSITION_PRI){
        tran.pri++;
        queue.push(tran);
        continue;
      }

      const stateNew = O.rec([tran, 'next']);
      if(stateNew === null) continue;

      tran.pri = 0;
      queue.push(stateNew);
      queue.push(tran);

      continue;
    }

    assert.fail(elem);
  }

  esolangs.err(`Unsatisfiable constraints`);
};

module.exports = run;