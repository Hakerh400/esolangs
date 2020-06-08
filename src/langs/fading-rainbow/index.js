'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');

const run = (src, input) => {
  const blocks = O.match(src.toString(), /\.|[01]+|\S/g);
  const blocksNum = blocks.length;

  for(let i = 0; i !== blocksNum; i++){
    const block = blocks[i];

    if(block === '.'){
      blocks[i] = '';
      continue;
    }

    if(!/^[01]+$/.test(block))
      esolangs.err(`Invalid block ${O.sf(block)}`);
  }

  if(blocksNum < 8)
    esolangs.err(`Source code must contain at least 8 blocks, but it contains ${blocksNum}`);

  if(blocksNum & 1)
    esolangs.err(`Unmatched block ${O.sf(blocks[blocksNum - 5])}`);

  const rulesNum = blocksNum - 8 >> 1;

  let mainStr = `${blocks[0]}${input.replace(/./g, a => {
    return `${blocks[1]}${a}${blocks[2]}`;
  })}${blocks[3]}`;

  if(rulesNum !== 0){
    while(1){
      const matches = new O.PriorityQueue();
      let halt = 0;

      for(let ruleIndex = 0; ruleIndex !== rulesNum; ruleIndex++){
        const str1 = blocks[4 + (ruleIndex << 1)];
        const str2 = blocks[4 + (ruleIndex << 1) + 1];
        const len = str1.length;
        const last = ruleIndex === rulesNum - 1;

        let start = 0;

        while(1){
          const index = mainStr.indexOf(str1, start);
          if(index < start) break;

          matches.push(new Match(ruleIndex, index, len, str2));
          start = index + 1;
          if(last) halt = 1;
        }
      }

      mainStr = '';

      while(matches.len !== 0)
        mainStr += matches.pop().str;

      if(halt) break;
    }
  }

  {
    const len = mainStr.length;
    const marked = O.ca(len, () => 0);

    if(mainStr.startsWith(blocks[blocksNum - 4]))
      for(let i = blocks[blocksNum - 4].length - 1; i !== -1; i--)
        marked[i] = 1;

    if(mainStr.endsWith(blocks[blocksNum - 1]))
      for(let i = blocks[blocksNum - 1].length - 1; i !== -1; i--)
        marked[len - i - 1] = 1;

    for(const str of blocks.slice(blocksNum - 3, blocksNum - 1)){
      if(str === '') continue;

      let start = 0;

      while(1){
        const index = mainStr.indexOf(str, start);
        if(index < start) break;

        for(let i = 0; i !== str.length; i++)
          marked[index + i] = 1;

        start = index + 1;
      }
    }

    mainStr = marked.map((m, i) => {
      return m ? '' : mainStr[i];
    }).join('');
  }

  return Buffer.from(mainStr);
};

class Match extends O.Comparable{
  constructor(ruleIndex, start, length, str){
    super();

    this.ruleIndex = ruleIndex;
    this.start = start;
    this.length = length;
    this.str = str;
  }

  cmp(match){
    return (
      this.start - match.start ||
      this.length - match.length ||
      this.ruleIndex - match.ruleIndex
    );
  }
}

module.exports = run;