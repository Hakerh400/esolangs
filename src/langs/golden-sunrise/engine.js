'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const List = require('@hakerh400/list');
const esolangs = require('../..');
const cs = require('./ctors');
const types = require('./types');

const {ListNode} = List;

const defaultOpts = {
  debug: 0,
  useBitIO: 0,
};

class Engine{
  constructor(parsed, input, opts){
    this.parsed = parsed;
    this.input = input;
    this.output = null;
    this.opts = {...defaultOpts, ...opts};
  }

  run(){
    const {parsed, input, opts} = this;

    const ioCtor = opts.useBitIO ? BitIO : O.IO;
    const io = new ioCtor(input);

    const {root} = parsed.tree;
    const list = new List();

    {
      const mainGroupStart = new ListNode(list, types.GROUP_START);
      list.push(mainGroupStart);
      list.push(new ListNode(list, types.BIT0));

      while(io.hasMore)
        list.push(new ListNode(list, io.read() ? types.BIT1 : types.BIT0));

      const mainGroupEnd = new ListNode(list, types.GROUP_END);
      list.push(mainGroupEnd);

      mainGroupStart.ref = mainGroupEnd;
    }

    const checkpoints = [];

    mainLoop: while(1){
      if(checkpoints.length === 0){
        let node = list.head;

        while(node !== list.tail){
          const type = node.val;

          if(type === types.GROUP_START){
            checkpoints.push(node);
            continue mainLoop;
          }

          node = node.next;
        }

        break;
      }

      const start = O.last(checkpoints);
      const end = start.ref;

      let node = start.next;
      let tnode = root;
      let elemsArr = null;

      while(1){
        const type = node.val;

        if(tnode.hasAny){
          elemsArr = tnode.followAny();
          break;
        }

        if(type === types.GROUP_START) break;

        if(type === types.GROUP_END){
          elemsArr = tnode.followEnd();
          break;
        }

        node = node.next;
        tnode = type === types.BIT1 ? tnode.followBit1() : tnode.followBit0();
      }

      if(elemsArr === null){
        checkpoints.push(node);
        continue;
      }

      if(opts.debug) logList(list);

      checkpoints.pop();

      const groupsStack = [];
      const matchStart = node;

      node = start;

      for(const elem of elemsArr){
        if(elem === types.MATCH){
          let n = matchStart;

          while(n !== end){
            const type = n.val;
            n = n.next;

            const nodeNew = new ListNode(list, type);
            node.insertAfter(nodeNew);
            node = nodeNew;

            if(type === types.GROUP_START){
              groupsStack.push(nodeNew);
              continue;
            }

            if(type === types.GROUP_END){
              const start = groupsStack.pop();
              start.ref = nodeNew;
              continue;
            }
          }

          continue;
        }

        const nodeNew = new ListNode(list, elem);
        node.insertAfter(nodeNew);
        node = nodeNew;

        if(elem === types.GROUP_START){
          groupsStack.push(nodeNew);
          continue;
        }

        if(elem === types.GROUP_END){
          const start = groupsStack.pop();
          start.ref = nodeNew;
          continue;
        }
      }

      node.next = end;
      end.prev = node;

      start.remove();
      end.remove();
    }

    for(const elem of list)
      io.write(elem.val === types.BIT1);

    this.output = io.getOutput();
  }
  
  getOutput(){
    return this.output;
  }
}

class BitIO{
  constructor(input){
    this.input = String(input).split('').map(a => a | 0);
    this.output = [];
    this.inputIndex = 0;
  }

  get hasMore(){
    return this.inputIndex !== this.input.length;
  }

  read(){
    if(!this.hasMore) return 0;
    return this.input[this.inputIndex++];
  }

  write(bit){
    this.output.push(bit | 0);
  }

  getOutput(){
    return Buffer.from(this.output.join(''));
  }
}

const logList = list => {
  let str = '';

  for(const elem of list)
    str += '01.()'[elem.val];

  log(str);
};

module.exports = Engine;