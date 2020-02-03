'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../../..');

class TreeNode{
  #bit0 = null;
  #bit1 = null;
  #end = null;
  #any = null;

  #regsNum = 0;
  #isFull = 0;

  followBit(bit){
    return bit ? this.followBit1() : this.followBit0();
  }

  followBit0(){
    if(this.#any !== null) return null;

    if(this.#bit0 === null){
      this.#bit0 = new TreeNode();
      if(++this.#regsNum === 3) this.#isFull = 1;
    }

    return this.#bit0;
  }

  followBit1(){
    if(this.#any !== null) return null;

    if(this.#bit1 === null){
      this.#bit1 = new TreeNode();
      if(++this.#regsNum === 3) this.#isFull = 1;
    }

    return this.#bit1;
  }

  followEnd(){
    if(this.#any !== null) return null;

    if(this.#end === null){
      this.#end = [];
      if(++this.#regsNum === 3) this.#isFull = 1;
    }

    return this.#end;
  }

  followAny(){
    if(this.#regsNum !== 0) return null;

    if(this.#any === null){
      this.#any = [];
      this.#isFull = 1;
    }

    return this.#any;
  }

  getFreePattern(){
    const stack = [[[], this]];

    while(stack.length !== 0){
      const stackElem = stack.pop();
      const [pattern, node] = stackElem;

      if(!node.#isFull) return stackElem;
      if(node.#any !== null) continue;

      stack.push(
        [[...pattern, 0], node.#bit0],
        [[...pattern, 1], node.#bit1],
      );
    }

    return null;
  }

  get isFullRec(){
    return this.getFreePattern() === null;
  }

  get bit0(){ return this.#bit0; }
  get bit1(){ return this.#bit1; }

  get hasBit0(){ return this.#bit0 !== null; }
  get hasBit1(){ return this.#bit1 !== null; }
  get hasEnd(){ return this.#end !== null; }
  get hasAny(){ return this.#any !== null; }
  get isFull(){ return this.#isFull; }
}

module.exports = TreeNode;