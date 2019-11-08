'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');

class Thread{
  constructor(eng, node, block, prev=this, next=this){
    this.eng = eng;
    this.prev = prev;
    this.next = next;
    this.node = node;
    this.inst = block.inst;
  }

  get isSingle(){ return this.prev === this; }

  tick(){
    const {eng} = this;

    if(this.inst === null){
      if(this.isSingle)
        return eng.th = null;

      const {prev, next} = this;
      prev.next = next;
      next.prev = prev;
      return eng.th = next;
    }

    this.inst.tick(this);
    this.eng.th = this.next;
  }

  spawn(block){
    const thNew = new Thread(this.eng, this.node, block, this, this.next);

    this.next.prev = thNew;
    this.next = thNew;

    return thNew;
  }
}

module.exports = Thread;