'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');
const cs = require('./ctors');

const DEBUG = 0;

const emptyArr = [];
const emptyList = cs.List.empty;

class Engine{
  constructor(parsed, input){
    this.parsed = parsed;
    this.io = new O.IOBit(input);
  }

  run(){
    const {parsed: prog, io} = this;
    const output = [];

    const dbg = () => {
      log(`${'Code:'.padEnd(7)}${code}`);
      log(`${'Stack:'.padEnd(7)}${stack}`);
      // debug();
    };

    const code = new Stack(prog.elems);
    const stack = new Stack();

    while(!code.isEmpty){
      // if(DEBUG) dbg();

      const elem = code.pop();

      if(elem instanceof cs.List){
        stack.push(elem);
        continue;
      }

      const {type, args} = elem;

      switch(type){
        case 0: {
          const [a, b, c] = args;
          const arr = stack.slice(a, b);
          stack.insert(c, arr);
        } break;

        case 1: {
          const [a, b] = args;
          stack.remove(a, b);
        } break;

        case 2: {
          const [a, b, c] = args;
          const arr = stack.remove(a, b);
          stack.insert(c, arr);
        } break;

        case 3: {
          const [a, b] = args;
          const arr = stack.remove(a, b);
          stack.insert(a, [new cs.List(arr)]);
        } break;

        case 4: {
          const [a] = args;
          const e = stack.remove(a, 1)[0];
          if(e instanceof cs.List){
            stack.insert(a, e.elems);
            break;
          }
          const bit = io.read();
          if(bit) stack.insert(a, [e]);
        } break;

        case 5: {
          const [a] = args;
          const e = stack.remove(a, 1)[0];
          if(e instanceof cs.List){
            code.insert(0, e.elems);
            break;
          }
          io.write(e.type >= 3);
        } break;

        default:
          assert.fail(type);
          break;
      }
    }

    if(DEBUG) dbg();
  }
  
  getOutput(){
    return this.io.getOutput();
  }
}

class Stack extends O.Stringifiable{
  constructor(elems=null){
    super();

    this.elems = elems !== null ?
      elems.slice() : [];
  }

  get len(){ return this.elems.length; }
  get isEmpty(){ return this.len === 0; }

  push(elem){
    const {elems} = this;
    elems.unshift(elem);
  }

  pop(){
    const {elems} = this;
    if(elems.length === 0) return emptyList;
    return elems.shift();
  }

  expand(len){
    const {elems} = this;
    while(elems.length < len){
      if(DEBUG) assert.fail();
      elems.push(emptyList);
    }
  }

  slice(start, len){
    const {elems} = this;
    const end = start + len;
    this.expand(end);
    return elems.slice(start, end);
  }

  splice(start, len, arr){
    const {elems} = this;
    const end = start + len;
    this.expand(end);
    const a = elems.splice(start, len);
    for(let i = 0; i !== arr.length; i++)
      elems.splice(start + i, 0, arr[i]);
    return a;
  }

  insert(start, arr){
    this.splice(start, 0, arr);
  }

  remove(start, len){
    return this.splice(start, len, emptyArr);
  }

  toStr(){
    if(this.isEmpty) return '/';
    return this.join([], this.elems, ' ');
  }
}

module.exports = Engine;