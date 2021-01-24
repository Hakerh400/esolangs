'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const parser = require('./parser');
const cs = require('./ctors');

const DEBUG = 0;

const VERSION = [0, 1, 0];

const run = (src, input) => {
  const mainStack = new cs.Stack();
  const srcStack = parser.parse(src);

  if(srcStack === null)
    esolangs.err(`Unmatched parentheses`);

  checkVersion: {
    const ver = srcStack.pop();

    if(ver === null)
      esolangs.err(`Missing program version`);

    const verInfo = ver.ints;

    if(verInfo.length !== VERSION.length)
      esolangs.err(`The length of the version stack must be ${VERSION.length}`);

    if(verInfo.some((a, b) => a !== VERSION[b]))
      esolangs.err(`Expected version ${
        ver2str(VERSION)}, but found ${
        ver2str(verInfo)}`);
  }

  input = [...input];
  const output = [];
  let halt = 0;

  const read = () => {
    if(input.length === 0) return 0;
    return input.shift();
  };

  const write = byte => {
    if(byte === 0){
      halt = 1;
      return;
    }

    output.push(byte);
  };

  const exec = function*(stack){
    if(DEBUG) O.logb();

    while(!halt && !stack.empty){
      if(DEBUG){
        log();
        log('MAIN: ' + mainStack.elems.join(' '));
        log('STACK: ' + stack.elems.join(' '));
        log();
      }

      const cmd = stack.pop();
      if(!check(cmd)) return;

      if(cmd.len === 1){
        if(DEBUG) log('Insert');
        mainStack.pushStack(cmd.top());
        continue;
      }

      switch(String(cmd)){
        case '((())())': {
          if(DEBUG) log('Delete');
          if(!check(mainStack.pop())) return;
        } break;

        case '((())(()()))': {
          if(DEBUG) log('Duplicate');
          const s = mainStack.top();
          if(!check(s)) return;
          mainStack.push(O.rec([s, 'dup']));
        } break;

        case '((()(()))())': {
          if(DEBUG) log('Push');
          const s = mainStack.pop();
          if(!check(s)) return;
          const v = mainStack.pop();
          if(!check(v)) return;
          mainStack.push(s.push(v));
        } break;

        case '(((()()))(()(())))': {
          if(DEBUG) log('Pop');
          const s = mainStack.pop();
          if(!check(s)) return;
          const v = s.pop();
          if(!check(v)) return;
          mainStack.push(v).push(s);
        } break;

        case '(((()()))(()()))': {
          if(DEBUG) log('Release');
          const s = mainStack.pop();
          if(!check(s)) return;
          mainStack.pushStack(s);
        } break;

        case '((((()))())(()))': {
          if(DEBUG) log('Run');
          const s = mainStack.pop();
          if(!check(s)) return;

          if(stack.empty){
            if(DEBUG) log('--- TCO');
            yield O.tco(exec, s);
          }

          if(DEBUG) log.inc();
          yield [exec, s];
          if(DEBUG) log.dec();
        } break;

        case '(()(((()))))': {
          if(DEBUG) log('Input');
          const n = read();
          mainStack.push(cs.Stack.fromInt(n));
        } break;

        case '((((())))())': {
          if(DEBUG) log('Output');
          const s = mainStack.pop();
          if(!check(s)) return;
          const n = s.int;
          write(n);
        } break;

        default: {
          check(null);
          return;
        } break;
      }
    }
  };

  O.rec(exec, srcStack);

  if(DEBUG) O.logb();

  return Buffer.from(output);
};

const check = stack => {
  if(stack !== null) return 1;
  if(DEBUG) assert.fail();
  return 0;
};

const ver2str = ver => {
  return ver.join('.');
};

module.exports = run;