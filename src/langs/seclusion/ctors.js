'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const bridge = require('./bridge');

const {abs} = Math;

class Base{}

class Block extends Base{
  static blocks = [];

  constructor(insts){
    super();

    const len = insts.length;
    let inst = null;

    for(let i = len - 1; i !== -1; i--){
      insts[i].next = inst;
      inst = insts[i];
      inst.parent = this;
    }

    this.parent = null;
    this.inst = inst;

    if(inst === null) Block.blocks.push(this);
  }

  static resolveInsts(){
    for(const block of Block.blocks){
      const inst = block.parent;
      if(inst === null) continue;

      if(inst.isIf){
        block.inst = inst.next;
        continue;
      }

      if(inst.While){
        block.inst = inst;
        continue;
      }
    }

    Block.blocks = null;
  }
}

class Instruction extends Base{
  static insts = [];

  constructor(){
    super();

    this.parent = null;
    this.next = null;

    Instruction.insts.push(this);
  }

  static resolveNext(){
    for(const inst of Instruction.insts){
      if(inst.next !== null) continue;

      let block = inst.parent;

      while(block.parent !== null){
        const parentInst = block.parent;

        if(parentInst.isWhile){
          inst.next = parentInst;
          break;
        }

        if(parentInst.isIf){
          if(parentInst.next !== null){
            inst.next = parentInst.next;
            break;
          }
          
          block = parentInst.parent;
          continue;
        }

        break;
      }
    }

    Instruction.insts = null;
  }

  get isControl(){ return 0; }

  tick(th){ O.virtual('tick'); }
}

class Move extends Instruction{
  constructor(arr){
    super();
    this.arr = arr;
  }

  tick(th){
    const {node} = th;

    th.node = node.navArr(this.arr.eval(node));
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

class Control extends Instruction{
  get isControl(){ return 1; }
  get isIf(){ return 0; }
  get isWhile(){ return 0; }
  get isThread(){ return 0; }
  get isJump(){ return 0; }
}

class If extends Control{
  constructor(block1, block2){
    super();
    this.block1 = block1;
    this.block2 = block2;
    block1.parent = this;
    block2.parent = this;
  }

  get isIf(){ return 1; }
}

class IfNz extends If{
  tick(th){
    th.inst = th.node.val !== 0 ? this.block1.inst : this.block2.inst;
  }
}

class IfOdd extends If{
  tick(th){
    th.inst = (th.node.val & 1) === 1 ? this.block1.inst : this.block2.inst;
  }
}

class While extends Control{
  constructor(block){
    super();
    this.block = block;
    block.parent = this;
  }

  get isWhile(){ return 1; }
}

class WhileNz extends While{
  tick(th){
    if(th.node.val !== 0){
      th.node.val--;
      th.inst = this.block.inst;
    }else{
      th.inst = this.next;
    }
  }
}

class WhileOdd extends While{
  tick(th){
    if((th.node.val & 1) === 1){
      th.node.val >>= 1;
      th.inst = this.block.inst;
    }else{
      th.inst = this.next;
    }
  }
}

class Thread extends Control{
  constructor(block){
    super();
    this.block = block;
    block.parent = this;
  }

  get isThread(){ return 1; }

  tick(th){
    th.spawn(this.block);
    th.inst = this.next;
  }
}

class Jump extends Control{
  constructor(arr){
    super();
    this.arr = arr;
  }

  get isJump(){ return 1; }

  tick(th){
    const {node} = th;
    const arr = this.arr.eval(node);

    const blocks = [];
    let block = this.parent;

    while(1){
      const parentInst = block.parent;

      if(parentInst === null || parentInst.isControl && parentInst.isThread){
        blocks.push(block);
        if(parentInst === null) break;
      }

      block = parentInst.parent;
    }

    block = blocks[arr.reduce((a, b) => a + b, 0) % blocks.length];
    th.inst = block.inst;
  }
}

class ArrayElement extends Base{
  get isNum(){ return 0; }
  get isArr(){ return 0; }
  get isOp(){ return 0; }

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
  constructor(elems=[], reduce=1){
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
      const arrPrev = O.last(stack)[2];

      for(const num of op.apply(node, arr))
        arrPrev.push(num);
    }
  }

  toArr(){ return this; }
}

class Operator extends ArrayElement{
  constructor(arr){
    super();
    this.arr = arr;
  }

  get isOp(){ return 1; }
  apply(node, arr){ O.virtual('apply'); }
}

class Get extends Operator{}

class GetNumber extends Operator{
  apply(node, arr){
    node = node.navArr(arr);
    return [node.val];
  }
}

class GetArray extends Operator{
  apply(node, arr){
    node = node.navArr(arr);

    const len = node.val;
    arr = [];

    for(let i = 0; i !== len; i++)
      arr.push(node.nav(i).val);

    return arr;
  }
}

class Bridge extends Operator{
  apply(node, arr){
    return bridge(arr);
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
  If,
  IfNz,
  IfOdd,
  While,
  WhileNz,
  WhileOdd,
  Thread,
  Jump,
  ArrayElement,
  Number,
  Array,
  Operator,
  Get,
  GetNumber,
  GetArray,
  Bridge,
};