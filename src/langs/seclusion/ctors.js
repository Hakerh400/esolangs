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
  constructor(arr){
    super();
    this.arr = arr;
  }

  tick(th){
    const {node} = th;

    th.node = node.nav(this.arr.eval(node));
    th.inst = this.next;
  }
}

class Increment extends Instruction{
  tick(th){
    const {node} = th;

    node.val++;
    th.inst = this.next;
  }
}

class Put extends Instruction{
  constructor(arr){
    super();
    this.arr = arr;
  }
}

class PutNumber extends Put{
  tick(th){
    const {node} = th;
    const arr = this.arr.eval(node);
    
    node.val = abs(node.val - arr.reduce((a, b) => a ^ b, 0));
    th.inst = this.next;
  }
}

class PutArray extends Put{
  tick(th){
    const {node} = th;
    const arr = this.arr.eval(node);

    node.val = abs(node.val - arr.length);

    arr.forEach((num, i) => {
      const n = node.nav(i);
      n.val = abs(n.val - num);
    });

    th.inst = this.next;
  }
}

class Control extends Instruction{}

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
    const stack = [[null, this.elems, [], 0]];

    loop: while(1){
      const sf = O.last(stack);
      const [op, elems, arr, index] = sf;

      for(let i = index; i !== elems.length; i++){
        const elem = elems[i];

        if(elem.isNum){
          arr.push(elem.val);
          continue;
        }

        sf[3] = i + 1;
        stack.push([elem, elem.arr.elems, [], 0]);
        continue loop;
      }

      if(op === null)
        return arr;

      stack.pop();
      O.last(stack)[2].push(op.apply(node, arr));
    }
  }

  toArr(){ return this; }
}

class Get extends ArrayElement{
  constructor(arr){
    super();
    this.arr = arr;
  }

  get isGet(){ return 1; }
  apply(node, arr){ O.virtual('apply'); }
}

class GetNumber extends Get{
  apply(node, arr){
    node = node.navArr(arr);
    return [node.val];
  }
}

class GetArray extends Get{
  apply(node, arr){
    node = node.navArr(arr);

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
  PutNumber,
  PutArray,
  Control,
  ArrayElement,
  Number,
  Array,
  Get,
  GetNumber,
  GetArray,
};