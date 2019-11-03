'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');

const fdIn = process.stdin.fd;
const buff = Buffer.alloc(2);
const debug = (...args) => {
  log(...args);
  fs.readSync(fdIn, buff, 0, 2);
  return O.last(args);
};

let m = 0;
const display = str => {
  // if(m > 250) O.exit();
  log(`[${++m}] ${str}`);
  // debug();
};

class Node{
  constructor(prev=null, val=0, path=[]){
    this.ptrs = O.obj();
    this.val_ = val;
    this.path = path;

    if(prev !== null)
      this.ptrs[0] = prev;
  }

  get val(){ return this.val_; }
  set val(val){
    if(val > 1e3) O.exit(val);
    this.val_ = val;
    // display('(' + this.path.join(',') + ') ---> ' + val);
  }

  nav(ptr, val=0){
    const {ptrs} = this;
    if(!(ptr in ptrs)) ptrs[ptr] = new Node(this, val, [...this.path, ptr]);
    return ptrs[ptr];
  }

  navArr(arr){
    let node = this;
    
    for(const num of arr)
      node = node.nav(num);

    return node;
  }
}

module.exports = Node;