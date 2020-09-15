'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');

const run = async (source, input) => {
  const grid = [];
  const mem = O.obj();

  /*
    0 - up
    1 - right
    2 - down
    3 - left
  */

  let ipX = 0;
  let ipY = 0;
  let ipDir = 2;
  let mp = 2;

  const overrun = dir => {
    esolangs.err(`Instruction pointer travelled off the ${dir} of the source code`);
  };

  const checkIp = (x, y) => {
    if(y >= grid.length) overrun('bottom');
    if(x >= grid[y].length) overrun('right');
  };

  const gridGet = (x, y) => {
    assert(y >= 0 && y < grid.length, y);

    const row = grid[y];
    assert(x >= 0 && x < row.length, x);

    return row[x];
  };

  const memGet = mp => {
    assert(mp >= 0);
    return mem[mp] | 0;
  };

  const memSet = (mp, val) => {
    assert(val === 0 || val === 1);

    IO: if(mp === 0 && val !== memGet(0)){
      /*
        If TL1 and TL2, then a 1 bit is output.
        If TL1 and not TL2, then a 0 bit is output.
        If not TL1, then a bit is input and saved in TL2.
      */

      if(memGet(1)) out(memGet(2));
      else memSet(2, inp());
    }

    mem[mp] = val;
  };

  const memFlip = mp => memSet(mp, memGet(mp) ^ 1);
  const move = (dx, dy) => checkIp(ipX += dx, ipY += dy);

  const up = () => move(0, -1);
  const right = () => move(1, 0);
  const down = () => move(0, 1);
  const left = () => move(-1, 0);

  const moveDir = dir => {
    switch(dir){
      case 0: up(); break;
      case 1: right(); break;
      case 2: down(); break;
      case 3: left(); break;
      default: assert.fail(dir); break;
    }
  };

  const invDir = dir => dir + 2 & 3;
  const turnLeft = () => ipDir = ipDir - 1 & 3;
  const turnRight = () => ipDir = ipDir + 1 & 3;

  while(ipX >= 0 && ipY >= 0){
    // Space
    if(gridGet(ipX, ipY) === 0){
      moveDir(ipDir);

      // Left
      if(ipDir === 3){
        if(mp === 0) esolangs.err(`Data pointer cannot be negative`);
        mp--;
        memFlip(mp);
        continue;
      }

      // Up
      if(ipDir === 0){
        mp++;
        continue;
      }

      continue;
    }

    // Non-space

    moveDir(invDir(ipDir));

    if(memGet(mp) === 0) turnLeft();
    else turnRight();
  }
};

module.exports = run;