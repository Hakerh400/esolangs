'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Program = require('./program');

const CATCH_ERRORS = 0;

class Engine{
  #program;

  paused = 1;

  constructor(lang, script, maxSize, criticalSize){
    this.#program = new Program(lang, script, maxSize, criticalSize);
  }

  getRetVal(){ return this.#program.getRetVal(); }
  setRetVal(val){ this.#program.setRetVal(val); }

  get stdin(){ return this.#program.stdin; }
  get stdout(){ return this.#program.stdout; }
  get stderr(){ return this.#program.stderr; }

  get active(){ return !this.paused && this.#program.active; }
  get done(){ return this.#program.done; }

  get calledGC(){ return this.#program.calledGC; }

  tick(){
    this.#program.tick();
  }

  run(ticks=null){
    const g = this.#program;

    this.paused = 0;

    while(this.active){
      if(g.stage === 2 && ticks !== null && ticks-- === 0){
        ticks++;
        break;
      }

      this.tick();
    }

    this.paused = 1;
    return ticks;
  }

  pause(){
    this.paused = 1;
    return this;
  }
}

module.exports = Engine;