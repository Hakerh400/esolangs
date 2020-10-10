'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');
const cs = require('./ctors');
const cmds = require('./cmds');
const conds = require('./conds');

const DEBUG = 0;
const ADD_RANDOM_CITIES = 1;

class Engine{
  constructor(parsed, input){
    this.parsed = parsed;
    this.input = input;
    this.output = null;
  }

  run(){
    const {parsed: prog, input} = this;
    const {tapeSize} = prog;

    const tape = O.obj();
    const map = new O.Map2D();

    let citiesNum = 0;
    let ip = 0n;
    let sx = null;
    let sy = null;

    O.sanl(input.toString()).forEach((row, y) => {
      row.split('').forEach((char, x) => {
        if(char === ' ') return;

        if(char === '#'){
          citiesNum++;
          map.set(x, y, 1);
          return;
        }

        if(char === '*'){
          if(sx !== null)
            esolangs.err(`Input cannot contain multiple "*" characters`);

          citiesNum++;
          map.set(x, y, 1);
          sx = x;
          sy = y;
          return;
        }

        esolangs.err(`${O.sf(char)} is not a valid input character`);
      });
    });

    if(sx === null)
      esolangs.err(`Input must contain "*" character somewhere`);

    let vx = sx;
    let vy = sy;

    // Ensure that all cities are connected
    {
      const visited = new O.Set2D([[vx, vy]]);
      const queue = [[vx, vy]];

      while(queue.length !== 0){
        const [x, y] = queue.shift();

        if(map.has(x, y - 1) && !visited.has(x, y - 1)){
          visited.add(x, y - 1);
          queue.push([x, y - 1]);
        }

        if(map.has(x + 1, y) && !visited.has(x + 1, y)){
          visited.add(x + 1, y);
          queue.push([x + 1, y]);
        }

        if(map.has(x, y + 1) && !visited.has(x, y + 1)){
          visited.add(x, y + 1);
          queue.push([x, y + 1]);
        }

        if(map.has(x - 1, y) && !visited.has(x - 1, y)){
          visited.add(x - 1, y);
          queue.push([x - 1, y]);
        }
      }

      if(visited.size !== citiesNum)
        esolangs.err(`All cities in the input map must be connected`);
    }

    const visited = new O.Set2D([[vx, vy]]);

    const getBounds = (dbg=0) => {
      const bounds = dbg ?
        [vx, vy, vx, vy] :
        [null, null, null, null];

      map.iter((x, y, d) => {
        if(d !== 1) return;

        if(bounds[0] === null){
          bounds[0] = bounds[2] = x;
          bounds[1] = bounds[3] = y;
          return;
        }

        if(x < bounds[0]) bounds[0] = x;
        else if(x > bounds[2]) bounds[2] = x;

        if(y < bounds[1]) bounds[1] = y;
        else if(y > bounds[3]) bounds[3] = y;
      });

      if(bounds[0] === null)
        return null;

      return bounds;
    };

    const map2str = (dbg=0) => {
      const bounds = getBounds(dbg);
      if(bounds === null) return '';

      const [x1, y1, x2, y2] = bounds;
      let str = '';

      for(let y = y1; y <= y2; y++){
        if(y !== y1) str += '\n';

        for(let x = x1; x <= x2; x++){
          const d = map.get(x, y) === 1;

          if(dbg){
            if(x === vx && y === vy){
              str += '*';
              continue;
            }

            if(d && visited.has(x, y)){
              str += '%';
              continue;
            }
          }

          str += d ? '#' : ' ';
        }
      }

      return str;
    };

    let mapStr = null;

    const logMap = () => {
      const str = map2str(1);
      if(str === mapStr) return;

      mapStr = str;

      debug(str);
    };

    if(DEBUG) logMap();

    // Add random cities
    if(ADD_RANDOM_CITIES){
      let i = -1;

      while(O.rand(2)){
        let [x, y] = [i, i];

        while(1){
          const dirs = [];

          if(!map.has(x, y - 1)) dirs.push(0);
          if(!map.has(x + 1, y)) dirs.push(1);
          if(!map.has(x, y + 1)) dirs.push(2);
          if(!map.has(x - 1, y)) dirs.push(3);

          if(dirs.length !== 4 && O.rand(2)){
            map.set(x, y, 1);
            citiesNum++;
            break;
          }

          switch(O.randElem(dirs)){
            case 0: y--; break;
            case 1: x++; break;
            case 2: y++; break;
            case 3: x--; break;
          }
        }

        i--;
      }

      if(DEBUG) logMap();
    }

    const checkCond = cond => {
      let c = 0;

      switch(cond.cond){
        case conds.isCity: c = map.get(vx, vy) === 1; break;
        case conds.isCityUp: c = map.get(vx, vy - 1) === 1; break;
        case conds.isCityDown: c = map.get(vx, vy + 1) === 1; break;
        case conds.isCityLeft: c = map.get(vx - 1, vy) === 1; break;
        case conds.isCityRight: c = map.get(vx + 1, vy) === 1; break;
        case conds.isBit: c = tape[ip] === 1; break;
        case conds.isFull: c = visitedAll; break;
        default: assert.fail(); break;
      }

      return c ^ cond.inverted;
    };

    const move = (x, y) => {
      if(visitedAll || map.get(x, y) === 1){
        vx = x;
        vy = y;

        if(!visited.has(x, y)){
          visited.add(x, y);

          if(!visitedAll && visited.size === citiesNum)
            visitedAll = 1;
        }
      }
    };

    const stack = [[null, prog.insts, 0]];

    let visitedAll = citiesNum === 1;

    while(stack.length !== 0){
      if(DEBUG) logMap();

      const frame = O.last(stack);
      const [ctrl, insts, index] = frame;

      if(index === insts.length){
        if(ctrl === null || ctrl instanceof cs.If){
          stack.pop();
          continue;
        }

        if(ctrl instanceof cs.Loop){
          if(checkCond(ctrl.cond)){
            frame[2] = 0;
            continue;
          }

          stack.pop();
          continue;
        }

        assert.fail();
      }

      const inst = insts[index];
      frame[2] = index + 1;

      if(inst instanceof cs.Command){
        switch(inst.cmd){
          case cmds.goUp: move(vx, vy - 1); break;
          case cmds.goDown: move(vx, vy + 1); break;
          case cmds.goLeft: move(vx - 1, vy); break;
          case cmds.goRight: move(vx + 1, vy); break;
          case cmds.tapeLeft: tapeSize !== 0n ? ip !== 0n ? ip - 1n : tapeSize - 1n : 0n; break;
          case cmds.tapeRight: tapeSize !== 0n ? ip !== tapeSize - 1n ? ip + 1n : 0n : 0n; break;
          case cmds.flipBit: tape[ip] ^= 1; break;
          case cmds.flipCity: if(visitedAll) map.set(vx, vy, map.get(vx, vy) ^ 1); break;
          case cmds.home: vx = sx; vy = sy; break;
          default: assert.fail(); break;
        }

        continue;
      }

      if(inst instanceof cs.Control){
        if(inst instanceof cs.If){
          stack.push([inst, checkCond(inst.cond) ? inst.insts1 : inst.insts2, 0]);
          continue;
        }

        if(inst instanceof cs.Loop){
          if(checkCond(inst.cond))
            stack.push([inst, inst.insts, 0]);
          continue;
        }

        assert.fail();
      }

      assert.fail();
    }

    if(DEBUG){
      logMap();
      log(`${'='.repeat(100)}\n`);
    }

    this.output = map2str();
  }
  
  getOutput(){
    return this.output;
  }
}

module.exports = Engine;