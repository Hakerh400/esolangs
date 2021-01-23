'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');

const {min, max, abs, floor, sin, cos} = Math;
const {pi, pih} = O;

const WIDTH = 20;

const nucleotides = 'ACGT';

const run = (src, input) => {
  src = src.toString();

  if(src.length === 0)
    esolangs.err(`Source code cannot be empty`);

  const helices = [[], []];
  const lines = O.sanl(src).map(a => a.trimRight());

  const w = WIDTH;
  const h = lines.length;

  const factor = pi / w;
  const wh = w / 2;
  const w1 = w - 1;

  for(let y = 0; y !== h; y++){
    const line = lines[y];
    const linet = line.trimLeft();

    const k = sin(y * factor + pih);
    const x1 = O.bound(floor((1 - k) * wh), 0, w1);
    const x2 = O.bound(floor((k + 1) * wh), 0, w1);

    if(line.length <= max(x1, x2))
      esolangs.err(`Invalid line ${O.sf(linet)}`);

    const charToInst = char => {
      const index = nucleotides.indexOf(char);

      if(index === -1)
        esolangs.err(`Invalid nucleotide ${O.sf(char)} on line ${O.sf(linet)}`);

      return index;
    };
    
    helices[0].push(charToInst(line[x1]));
    helices[1].push(charToInst(line[x2]));
  }

  const states = O.obj();

  let str = String(input);
  let helixIndex = 0;
  let instIndex = 0;

  while(1){
    const helix = helices[helixIndex];
    const inst = helix[instIndex];

    const state = `${str}.${helixIndex}.${instIndex}`;
    if(state in states) break;
    states[state] = 1;

    instIndex = (instIndex + 1) % h;

    if(inst <= 1){
      str += inst;
      continue;
    }

    if(inst === 2){
      str = O.rev(str);
      continue;
    }

    let bit = 0;

    if(str.length !== 0){
      bit = O.last(str) | 0;
      str = str.slice(0, str.length - 1);
    }

    if(bit) helixIndex ^= 1;
  }

  return Buffer.from(str);
};

module.exports = run;