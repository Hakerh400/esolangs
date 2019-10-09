'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

const EXCLUDE_INPUT = 0;
const OUTPUT_BITS = 0;
const CHECK_SNAPSHOT = 0;
const NORMALIZE = 0;

const run = (src, input) => {
  src = src.toString();

  const io = new O.IO(input);

  const tokens = /\s/.test(src) ? src.trim().split(/\s+/) : src.split('');
  if(tokens.length === 1 && tokens[0] === '') tokens.length = 0;

  let root = [];

  if(tokens.length !== 0){
    const nodes = O.obj();
    const stack = [root];

    nodes[tokens.shift()] = root;

    for(const token of tokens){
      const last = O.last(stack);
      const isNew = !(token in nodes);
      const node = isNew ? [] : nodes[token];

      if(isNew) nodes[token] = node;
      last.push(node);

      while(O.last(stack).length === 2){
        stack.pop();
        if(stack.length === 0) break;
      }

      if(isNew) stack.push(node);
      if(stack.length === 0) break;
    }

    for(const node of stack)
      while(node.length !== 2)
        node.push(node);
  }else{
    root.push(root, root);
  }

  const get = addr => {
    let node = root;
    for(const bit of addr) node = node[bit];
    return node;
  };

  const set = (addr, val) => {
    const len = addr.length;
    if(len === 0) return root = val;

    const len1 = len - 1;
    let node = root;

    for(let i = 0; i !== len1; i++) node = node[addr[i]];
    return node[addr[len1]] = val;
  };

  const add = (addr, val1, val2) => {
    return set(addr, [val1, val2]);
  };

  const addr = node => {
    const b0 = getB0();
    const visited = new Set();
    const addr = [];

    while(node !== b0 && !visited.has(node)){
      visited.add(node);
      addr.push(node[0] !== b0 ? 1 : 0);
      node = node[1];
    }

    return addr;
  };

  const getB0 = () => root[0][0][0];
  const getB1 = () => root[0][0][1];

  if(NORMALIZE){
    const arr = ser(root);
    let str = '';

    for(let i = 0; i !== arr.length; i++){
      if(i !== 0) str += i % 32 === 0 ? '\n' : ' ';
      str += O.hex(arr[i], 1);
    }

    log(str);
  }

  if(!EXCLUDE_INPUT){
    root = [root];

    const b0 = getB0();
    const b1 = getB1();
    let ioNode = root;

    while(io.hasMore){
      const newNode = [io.read() ? b1 : b0];
      ioNode.push(newNode);
      ioNode = newNode;
    }

    ioNode.push(b0);
  }

  const snapshots = CHECK_SNAPSHOT ? O.obj() : null;
  let foundLoop = 0;

  while(1){
    const b0 = getB0();
    if(root[0][1] === b0) break;

    if(CHECK_SNAPSHOT){
      const str = ser(root).join(',');

      if(str in snapshots){
        foundLoop = 1;
        break;
      }

      snapshots[str] = 1;
    }

    const type = root[0][1][0][0];
    const node = root[0][1][0][1];
    const isB0 = type === b0;
    const isB1 = type === root[0][0][1];

    if(isB0 || isB1){
      if(isB0) set(addr(node[0]), get(addr(node[1])));
      else add(addr(node[0]), get(addr(node[1][0])), get(addr(node[1][1])));
      root[0][1] = root[0][1][1];
      continue;
    }

    root[0][1] = get(addr(node[0][0])) === get(addr(node[0][1])) ? node[1] : root[0][1][1];
  }

  const output = addr(root[1]);

  if(OUTPUT_BITS){
    let str = output.join('');
    if(foundLoop) str = `[${str}]`;
    return str;
  }

  for(const bit of output) io.write(bit);
  return io.getOutput();
};

const ser = root => {
  const nodes = new Map();
  const stack = [root];
  let index = 0;
  let arr = [];

  while(stack.length !== 0){
    const node = stack.pop();

    if(nodes.has(node)){
      arr.push(nodes.get(node));
      continue;
    }

    nodes.set(node, index);
    arr.push(index++);
    stack.push(node[1], node[0]);
  }

  return arr;
};

module.exports = run;