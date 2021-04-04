'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');

class Memory{
  constructor(input=[]){
    this.root = new Bit(1,
      allZeros,
      O.rec(bits2node, input),
    );
  }

  *cmp(addr1, addr2){
    return O.tco([this, 'cmpNodes'],
      yield [[this, 'getNode'], addr1],
      yield [[this, 'getNode'], addr2],
    );
  }

  *cmpNodes(node1, node2, seen=new Map()){
    assert(node1 instanceof Bit);
    assert(node2 instanceof Bit);

    if(node1 === node2) return 1;
    if(node1.bit !== node2.bit) return 0;

    if(!seen.has(node1))
      seen.set(node1, new Set());

    const seen1 = seen.get(node1);
    if(seen1.has(node2)) return 1;

    seen1.add(node2);

    return (
      (yield [[node1, 'getLeft']]) === (yield [[node2, 'getLeft']]) &&
      (yield [[node1, 'getRight']]) === (yield [[node2, 'getRight']])
    );
  }

  *copy(from, to){
    const isPrefix = isPrefixOf(from, to);

    if(isPrefix && from.length === to.length)
      return;

    const nodeFrom = yield [[this, 'getNode'], from];

    if(to.length === 0){
      assert(!isPrefix);
      this.root = nodeFrom;
      return;
    }

    const lastBit = O.last(to);
    const nodeTo = yield [[this, 'getNode'], to.slice(0, -1)];

    const nodeNew = isPrefix ?
      yield [Ref.from, nodeFrom, to.slice(from.length)] :
      yield [[nodeFrom, 'copy']];

    nodeTo.setCh(lastBit, nodeNew);
  }

  *getNode(addr, currentRoot=this.root){
    if(addr.length === 0)
      return currentRoot;

    const [bit, ...rest] = addr;
    let ch = bit === 0 ? currentRoot.left : currentRoot.right;

    if(ch instanceof Ref){
      // Expand
      ch = yield [[ch.ref, 'copy']];

      currentRoot.setCh(bit, ch);
    }

    return O.tco([this, 'getNode'], rest, ch);
  }

  *getBit(addr){
    const node = yield [[this, 'getNode'], addr];
    assert(node instanceof Bit);
    return node.bit;
  }

  *getOutput(){
    return O.tco(node2bits, yield [[this.root, 'getRight']]);
  }

  toString(depth=1){
    return O.rec(node2str, this.root, depth);
  }
}

class Node{
  *copy(){ O.virtual('copy'); }
  *getNode(addr){ O.virtual('getNode'); }

  *getBit(addr){
    const node = yield [[this, 'getNode'], addr];
    assert(node instanceof Bit);
    return node.bit;
  }

  *getLeft(){
    return O.tco([this, 'getNode'], [0]);
  }

  *getRight(){
    return O.tco([this, 'getNode'], [1]);
  }
}

class Bit extends Node{
  constructor(bit, left=allZeros, right=allZeros){
    super();

    this.bit = bit;
    this.left = left;
    this.right = right;
  }

  getCh(i){
    if(i === 0) return this.left;
    return this.right;
  }

  setCh(i, ch){
    if(i === 0) this.left = ch;
    else this.right = ch;
  }

  *getNode(addr){
    if(addr.length === 0)
      return this;

    const [bit, ...rest] = addr;
    const ch = this.getCh(bit);

    return O.tco([ch, 'getNode'], rest);
  }

  *copy(){
    return new Bit(
      this.bit,
      yield [[this.left, 'copy']],
      yield [[this.right, 'copy']],
    );
  }
}

class Ref extends Node{
  static *from(node, addr){
    const copy = yield [[node, 'copy']];
    const ref = new Ref(copy);

    const lastNode = addr.slice(0, -1).reduce((node, bit) => {
      return node.getCh(bit);
    }, copy);

    lastNode.setCh(O.last(addr), ref);

    return ref;
  }

  constructor(ref){
    super();

    assert(ref instanceof Bit);
    this.ref = ref;
  }

  *getNode(addr){
    return O.tco([this.ref, 'getNode'], addr);
  }

  *copy(){
    return this;
  }
}

const allZeros = (() => {
  const zero = new Bit(0, null, null);
  const ref = new Ref(zero);

  zero.left = ref;
  zero.right = ref;

  return ref;
})();

const bit0 = allZeros;
const bit1 = new Ref(new Bit(1));

const bits2node = function*(bits){
  if(bits.length === 0)
    return allZeros;

  const [bit, ...rest] = bits;

  return new Bit(1,
    bit ? bit1 : bit0,
    yield [bits2node, rest],
  );
};

const node2bits = function*(node){
  if((yield [[node, 'getBit'], []]) === 0)
    return [];

  return [
    (yield [[node, 'getLeft']]).bit,
    ...yield [node2bits, yield [[node, 'getRight']]],
  ];
};

const isPrefixOf = (bits1, bits2) => {
  if(bits1.length > bits2.length)
    return 0;

  return bits1.every((bit, index) => {
    return bits2[index] === bit;
  });
};

const node2str = function*(node, depth){
  const rows = yield [node2strRows, node, depth];
  return rows.join('\n');
};

const node2strRows = function*(node, depth){
  if(depth === 0) return [];

  const depth1 = depth - 1;
  const spacesNum = (1 << depth1) - 1;
  const space = ' '.repeat(spacesNum);
  const left = yield [[node, 'getLeft']];
  const right = yield [[node, 'getRight']];
  const rows1 = yield [node2strRows, left, depth1];
  const rows2 = yield [node2strRows, right, depth1];

  return [
    `${space}${node.bit}${space}`,
    ...rows1.map((row, index) => {
      return `${row} ${rows2[index]}`;
    }),
  ];
};

module.exports = Memory;