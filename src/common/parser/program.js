'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const SG = require('../serializable-graph');
const PL = require('./programming-language');
const StdIO = require('./stdio');
const cgs = require('./common-graph-nodes');

const REFRESH = 0;

const DEFAULT_FILE_NAME = 'script.txt';

class Program extends SG{
  stdin = new StdIO();
  stdout = new StdIO();
  stderr = new StdIO();

  #lang = null;
  #source = null;
  #intp = null;
  #inited = 0;
  #retVal;

  stage = 0;

  constructor(lang, source, maxSize, criticalSize=null){
    super(lang.graphCtors, lang.graphRefs, maxSize);

    this.criticalSize = criticalSize;

    this.Parser = lang.Parser;
    this.Compiler = lang.Compiler;
    this.Interpreter = lang.Interpreter;

    this.#lang = lang;
    this.#source = source;
  }

  setIntp(intp){
    if(this.#intp !== null) return;
    this.#intp = intp;
  }

  getRetVal(){ return this.#retVal; }
  setRetVal(val){ this.#retVal = val; }

  get lang(){ return this.#lang; }
  get intp(){ return this.#intp; }
  get th(){ return this.#intp.th; }
  get active(){ return !this.#inited || this.#intp.active; }
  get done(){ return this.#inited && this.#intp.done; }

  tick(){
    if(!this.#inited){
      const srcStr = new cgs.String(this, this.#source);
      const fileName = cgs.str(this, DEFAULT_FILE_NAME);
      const script = new cgs.Script(this, srcStr, fileName);
      this.#intp = new this.#lang.Interpreter(this, script);
      this.#inited = 1;
      return;
    }

    this.#intp.tick();
  }

  deser(ser){
    super.deser(ser);
    this.#intp = this.main;
    return this;
  }
}

module.exports = Program;