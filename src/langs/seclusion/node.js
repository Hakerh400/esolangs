'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');

class Node{
  constructor(prev=null, val=0){
    this.ptrs = O.obj();
    this.val = val;

    if(prev !== null)
      this.ptrs[0] = prev;
  }

  nav(ptr, val=0){
    const {ptrs} = this;
    if(!(ptr in ptrs)) ptrs[ptr] = new Node(this, val);
    return ptrs[ptr];
  }
}

module.exports = Node;