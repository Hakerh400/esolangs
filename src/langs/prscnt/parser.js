'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const varChars = '?!@$%¨&*()_+=-[]{}:\\/~^\'"|';
const varRegStr = `[a-zA-Z0-9${varChars.replace(/./gs, a => `\\${a}`)}]+`;

const varReg = new RegExp(varRegStr);
const varRegB = new RegExp(`^${varRegStr}`);
const varRegBE = new RegExp(`^${varRegStr}$`);
const varRegG = () => new RegExp(varRegStr, 'g');

const parse = src => {
  const lines = O.sanl(src.toString()).
    map(line => line.
      replace(/#.*/s, '').
      replace(/\s+/g, ' ').
      trim()).
    filter(line => line);

  const prog = new cs.Program();

  for(const line of lines){
    const [cmd, vars] = parseLine(line);

    if(!O.has(cs.cmds, cmd))
      esolangs.err(`Unknown command ${O.sf(cmd)}`);

    const ctor = cs.cmds[cmd];

    if(isOp(ctor)){
      for(const v of vars)
        prog.addCmd(new ctor([v]));

      continue;
    }

    prog.addCmd(new ctor(vars));
  }

  return prog;
};

const parseLine = line => {
  const match = line.match(/^([^ ]+) ?(.*)$/s);

  if(match === null)
    esolangs.err(`Invalid syntax ${O.sf(line)}`);

  const cmd = match[1];
  const varsStr = match[2];
  const vars = varsStr ? varsStr.split(/ ?, ?/) : [];

  for(const v of vars)
    if(!varRegBE.test(v))
      esolangs.err(`Invalid variable name ${O.sf(v)}`);

  return [cmd, vars];
};

const isOp = ctor => {
  return cs.Operation.isPrototypeOf(ctor);
};

module.exports = {
  parse,
};