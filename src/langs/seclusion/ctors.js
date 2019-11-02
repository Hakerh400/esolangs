'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');

const {abs} = Math;

class Base{}

class Block extends Base{
  constructor(inst=null){
    super();
    this.parent = null;
    this.inst = inst;
  }
}

class Instruction extends Base{
  constructor(){
    super();
    this.parent = null;
    this.next = null;
  }

  tick(th){ O.virtual('tick'); }
}

class Move extends Instruction{
}

class Increment extends Instruction{
  tick(th){
    const {node} = th;

    node.val++;
    th.advance();
  }
}

class Put extends Instruction{
  constructor(arr){
    super();
    this.arr = arr;
  }
}

class PutNum extends Put{
  tick(th){
    const {node} = th;
    const arr = this.arr.eval(node);
    
    node.val = abs(node.val - arr.reduce((a, b) => a ^ b, 0));
    th.advance();
  }
}

class PutArr extends Put{
  tick(th){
    const {node} = th;
    const arr = this.arr.eval(node);

    node.val = abs(node.val - arr.length);

    arr.forEach((num, i) => {
      const n = node.nav(i);
      n.val = abs(n.val - num);
    });

    th.advance();
  }
}

class Control extends Instruction{
}

class ArrayElement extends Base{
  get isNum(){ return 0; }
  get isArr(){ return 0; }
  get isGet(){ return 0; }

  toArr(){ return new Array([this], 0); }
}

class Number extends ArrayElement{
  constructor(val){
    super();
    this.val = val;
  }

  get isNum(){ return 1; }
}

class Array extends ArrayElement{
  constructor(elems, reduce=1){
    super();

    if(!reduce){
      this.elems = elems;
    }else{
      const elemsReduced = [];

      for(const elem of elems){
        if(!elem.isArr){
          elemsReduced.push(elem);
          continue;
        }

        for(const e of elem.elems)
          elemsReduced.push(e);
      }

      this.elems = elemsReduced;
    }
  }

  get isArr(){ return 1; }

  eval(node){
    const {elems} = this;
    const stack = [];
    const arr = [];

    for(let i = 0; i !== elems.length; i++){
      const elem = elems[i];

      if(elem.isNum){
        arr.push(elem.val);
        continue;
      }

      O.noimpl('!elem.isNum');
    }

    return arr;
  }

  toArr(){ return this; }
}

class Get extends ArrayElement{
  constructor(arr){
    super();
    this.arr = arr;
  }

  get isGet(){ return 1; }
  get(node, arr){ O.virtual('get'); }

  nav(node, arr){
    for(const num of arr)
      node = node.nav(num);

    return node;
  }
}

class GetNum extends Get{
  get(node, arr){
    node = this.nav(node, arr);
    return node.val;
  }
}

class GetArr extends Get{
  get(node, arr){
    node = this.nav(node, arr);

    const len = node.val;
    arr = [];

    for(let i = 0; i !== len; i++)
      arr.push(node.nav(i).val);

    return arr;
  }
}

module.exports = {
  Base,
  Block,
  Instruction,
  Move,
  Increment,
  Put,
  PutNum,
  PutArr,
  Control,
  ArrayElement,
  Number,
  Array,
  Get,
  GetNum,
  GetArr,
};