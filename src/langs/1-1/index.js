'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const parser = require('../../common/parser');

const run = (src, input) => {
  const lines = O.sanl(src.toString());
  const linesNum = lines.length;

  if(lines.length < 2)
    esolangs.err(`Source code must contain at least two lines`);

  const rules = [];
  const rulesNum = linesNum - 2;

  let mainStr = null;
  let ruleIndex = 0;

  lines.forEach((line, index) => {
    const parts = line.split('|');
    const partsNum = parts.length;

    if(line.length < 2)
      esolangs.err(`Line ${O.sf(line)} does not contain "|" character`);

    if(parts[0] !== String(index + 1))
      esolangs.err(`Expected index ${O.sf(String(index + 1))}, but got ${O.sf(parts[0])} at line ${O.sf(line)}`);

    if(index === 0){
      if(partsNum !== 2)
        esolangs.err(`The first line ${O.sf(line)} must have exactly 2 parts`);

      mainStr = parts[1] || input.toString();
      return;
    }

    if(index === linesNum - 1){
      if(parts[1].toLowerCase() !== 'halt')
        esolangs.err(`The last line ${O.sf(line)} must contain the "halt" string`);

      return;
    }

    if(partsNum !== 5)
      esolangs.err(`Line ${O.sf(line)} must contain exactly 5 parts`);

    const isIndexValid = str => {
      if(!/^(?:0|[1-9][0-9]*)$/.test(str)) return 0;

      const index = BigInt(str);
      if(index < 2n || index > BigInt(linesNum)) return 0;

      return 1;
    };

    const toIndex = str => {
      if(!isIndexValid(str))
        esolangs.err(`Invalid index ${O.sf(str)} at line ${O.sf(line)}`);

      return Number(str) - 2;
    };

    rules.push([
      parts[1],
      parts[2],
      toIndex(parts[3]),
      toIndex(parts[4]),
    ]);
  });

  while(ruleIndex !== rulesNum){
    const [str1, str2, index1, index2] = rules[ruleIndex];
    const strIndex = mainStr.indexOf(str1);

    if(strIndex === -1){
      ruleIndex = index2;
      continue;
    }

    mainStr = mainStr.replace(str1, str2);
    ruleIndex = index1;
  }

  return Buffer.from(mainStr);
};

module.exports = run;