'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');

class Node{}

class Block extends Node{
  constructor(parent, inst){
    super();
    this.parent = parent;
    this.inst = inst;
  }
}

class Instruction extends Node{
  constructor(parent, next){
    super();
    this.parent = parent;
    this.next = next;
  }
}

module.exports = {

};