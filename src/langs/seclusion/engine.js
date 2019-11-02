'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const Node = require('./node');
const Thread = require('./thread');

class Engine{
  constructor(parsed, input){
    const rootNode = new Node(null, input.length);

    input.forEach((byte, index) => {
      rootNode.nav(index, byte);
    });

    this.rootNode = rootNode;
    this.th = new Thread(this, rootNode, parsed);
    this.output = null;
  }

  run(){
    while(this.th !== null)
      this.th.tick();

    const output = [];
    const node = this.rootNode;
    const len = node.val;

    for(let i = 0; i !== len; i++)
      output.push(node.nav(i).val);

    this.output = Buffer.from(output);
  }

  getOutput(){
    return this.output;
  }
}

module.exports = Engine;