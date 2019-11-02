'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const PTR_SIZE = 8;

const sizeSym = Symbol('size');

class SerializableGraph{
  dsr = 0;
}

class Node{
  static keys(){}
  constructor(g){
    this.g = g;
    this.graph = g;
  }
}

const SG = SerializableGraph;

module.exports = Object.assign(SG, {
  sizeSym,
  Node,
});