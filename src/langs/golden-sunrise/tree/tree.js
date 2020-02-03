'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const List = require('@hakerh400/list');
const esolangs = require('../../..');
const TreeNode = require('./tree-node');

const {ListNode} = List;

class Tree{
  constructor(){
    this.root = new TreeNode();
  }

  addRules(rules){
    rules.forEach((rule, index) => {
      this.addRule(rule, index);
    });
  }

  addRule(rule, ruleIndex=null){
    const {root} = this;
    const {lhs, rhs} = rule;

    const elems1 = lhs.elems;
    const elems2 = rhs.elems;
    const {isEnd, isAny} = lhs;

    const argNames = O.keys(lhs.idents);
    const argsObj = O.obj();

    argNames.forEach((name, index) => argsObj[name] = index);

    const argsNum = argNames.length;
    const argVals = O.ca(argsNum, () => 0);

    const err = () => {
      esolangs.err(`Rule with index ${ruleIndex + 1} is invalid`);
    };

    while(1){
      let node = root;

      for(const elem of elems1){
        const bit = elem.isIdent ?
          argVals[argsObj[elem.name]] :
          elem.val;

        node = node.followBit(bit);
        if(node === null) err();
      }

      if(!(isEnd ? node.followEnd() : node.followAny())) err();

      if(argsNum === 0) break;

      let end = 1;

      for(let i = 0; i !== argsNum; i++){
        if(argVals[i] ^= 1){
          end = 0;
          break;
        }
      }

      if(end) break;
    }
  }

  finalize(){
    const {root} = this;

    const patternInfo = root.getFreePattern();
    if(patternInfo === null) return;

    const [freePattern, node] = patternInfo;
    if(freePattern !== null)
      esolangs.err(`Missing rule for pattern ${pattern2str(freePattern, node)}`);
  }
}

class CustomListNode extends ListNode{
  group = null;
}

const pattern2str = (pattern, node) => {
  let str = pattern.join('');

  if(node.hasBit0 || node.hasBit1 || node.hasEnd){
    if(!node.hasBit0) str += '0';
    else if(!node.hasBit1) str += '1';
    else if(!node.hasEnd) str += '#';
  }

  if(str === '') str = '/';

  return O.sf(str);
};

module.exports = Object.assign(Tree, {
  TreeNode,
});