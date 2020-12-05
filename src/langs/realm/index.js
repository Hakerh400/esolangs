'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

const run = (src, input) => {
  src = src.toString();

  const reg = /[01\?]*(?:\.[01\?]*){2}|[01\?]*\.[01\?]*(?:\s*\()?|\)|[01\?]+/g;
  const io = new O.IOBit(input);
  const insts = [[]];

  const f = a => a !== '' ? [`0${a.slice(0, a.length - 1)}`, O.last(a)] : ['', '0'];

  for(const [tk] of O.exec(src, reg)){
    let m;

    if(m = tk.match(/^([01\?]*)\.([01\?]*)$/)) O.last(insts).push([0, f(m[1]), f(m[2])]);
    else if(m = tk.match(/^([01\?]*)\.([01\?]*)\.([01\?]*)$/)) O.last(insts).push([1, f(m[1]), f(m[2]), f(m[3])]);
    else if(m = tk.match(/^[01\?]*$/)) O.last(insts).push([2, tk]);
    else if(m = tk.match(/^([01\?]*)\.([01\?]*)\s*\($/)) O.last(insts).push([3, f(m[1]), f(m[2])]), insts.push([]);
    else{
      const len = insts.length;
      if(len < 2) esolangs.err(`Expected at least two instructions, but found ${len}`);

      O.last(insts[len - 2]).push(insts.pop());
    }
  }

  const root = [];
  const base = [root];
  root.push(root, root);

  const res = b => b === '?' ? io.read() : b | 0;
  const {iter} = {*iter(bs){ for(const b of bs) yield res(b); }};

  const get = addr => {
    let node = base;
    for(const b of iter(addr[0])) node = node[b];
    return node[res(addr[1])];
  };

  const set = (addr, val) => {
    let node = base;
    for(const b of iter(addr[0])) node = node[b];
    node[res(addr[1])] = val;
  };

  const out = bs => {
    for(const b of iter(bs)) io.write(b);
  };

  const stack = [[insts[0], 0]];

  while(stack.length !== 0){
    const frame = O.last(stack);
    const [insts, index] = frame;

    if(index === insts.length){
      stack.pop();
      continue;
    }

    const [type, ...args] = insts[index];

    if(type === 0) set(args[0], get(args[1]));
    else if(type === 1) set(args[0], [get(args[1]), get(args[2])]);
    else if(type === 2) out(args[0]);
    else if(get(args[0]) === get(args[1])){
      stack.push([args[2], 0]);
      continue;
    }

    frame[1]++;
  }

  return io.getOutput();
};

module.exports = run;