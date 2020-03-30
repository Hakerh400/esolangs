'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const List = require('@hakerh400/list');
const esolangs = require('../..');
const debug = require('../../common/debug');
const cs = require('./ctors');

const DEBUG = 0;

class Engine{
  constructor(parsed, input){
    input = input.toString().replace(/[\s+]/g, '');

    if(!/^[01]*$/.test(input))
      esolangs.err(`Input string can only contain bits`);

    this.parsed = parsed;
    this.input = input;
    this.output = null;
  }

  run(){
    const {parsed: prog, input} = this;
    const {rules} = prog;

    // Main list and active nodes
    const list = new RhsList();
    const active = new Set();

    // Initialize the list with the input string
    {
      list.push(list.activeNode(active));

      for(const bit of input)
        list.push(list.bitNode(bit | 0));
    }

    // Main loop
    while(active.size !== 0){
      if(DEBUG){
        log(list.toString());
      }

      const marked = new Set();
      const substs = new Map();

      for(const node of active){
        let mdNodes = null;
        let rhs = null;

        findRule: for(const rule of rules){
          const {lhs} = rule;
          const {elems1, elems2} = lhs;
          const md = new Set();

          let e = node;

          for(const elem of elems1){
            e = e.prev;
            if(e === null) continue findRule;
            if(e.val !== elem) continue findRule;
            md.add(e);
          }

          if(lhs.start && e.prev !== null) continue findRule;
          e = node;

          for(const elem of elems2){
            e = e.next;
            if(e === null) continue findRule;
            if(e.val !== elem) continue findRule;
            md.add(e);
          }

          if(lhs.end && e.next !== null) continue findRule;

          mdNodes = md;
          rhs = rule.rhs;

          break findRule;
        }

        if(mdNodes === null) continue;

        for(const node of mdNodes)
          marked.add(node);

        substs.set(node, rhs);
      }

      if(substs.size === 0)
        esolangs.err(`Cannot match current string against any rule:\n\n${list}`);

      for(const node of marked)
        node.remove();

      for(const [node, rhs] of substs){
        for(const elem of rhs.elems){
          if(elem !== 2) node.insertBefore(list.bitNode(elem));
          else node.insertBefore(list.activeNode(active));
        }

        node.remove();
        active.delete(node);
      }
    }

    this.output = Buffer.from(list.toString());
  }
  
  getOutput(){
    return this.output;
  }
}

class RhsList extends List{
  bitNode(bit){
    return this.node(bit);
  }

  activeNode(set){
    const node = this.node(2);
    set.add(node);
    return node;
  }

  toString(){
    let s = '';

    for(const node of this)
      s += '01.'[node.val];

    return s;
  }
}

module.exports = Engine;