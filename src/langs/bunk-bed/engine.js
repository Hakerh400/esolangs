'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');
const cs = require('./ctors');

const DEBUG = 0;

class Engine{
  constructor(parsed, input){
    this.parsed = parsed;
    this.io = new O.IOBit(input, 0);
  }

  run(){
    const {parsed: prog, io} = this;
    const {insts} = prog;
    const instsNum = insts.length;

    const vars = O.obj();
    let index = 0;

    const getVar = name => {
      if(!(name in vars))
        vars[name] = new Value();

      return vars[name];
    };

    const setVar = (name, val) => {
      vars[name] = val;
    };

    const evaluate = expr => {
      if(expr instanceof cs.Variable)
        return getVar(expr.name).copy();

      if(expr instanceof cs.Get)
        return getVar(expr.name).get(getVar(expr.key)).copy();

      if(expr instanceof cs.All)
        return new Value(getVar(expr.name));

      assert.fail(expr.constructor.name);
    };

    let first = 1;

    while(index < instsNum){
      const inst = insts[index];

      if(DEBUG){
        if(!first){
          log(O.sortAsc(O.keys(vars)).map(name => {
            return `${name}: ${getVar(name)}`;
          }).join('\n'));

          log(`\n${'='.repeat(100)}\n`);
        }else{
          first = 0;
        }

        debug(inst.toString());
      }

      if(inst instanceof cs.Jmp){
        index = inst.index;
        continue;
      }

      index++;

      if(inst instanceof cs.Assignment){
        const {name, expr} = inst;
        setVar(name, evaluate(expr));
        continue;
      }

      if(inst instanceof cs.Set){
        const {name, key, val} = inst;
        getVar(name).set(getVar(key), getVar(val));
        continue;
      }

      if(inst instanceof cs.Cmp){
        const {name1, name2} = inst;
        if(!getVar(name1).eq(getVar(name2)))
          index++;
        continue;
      }

      if(inst instanceof cs.Inp){
        if(!io.read()) index++;
        continue;
      }

      if(inst instanceof cs.Eof){
        if(io.hasMore) index++;
        continue;
      }

      if(inst instanceof cs.Out){
        io.write(inst.bit);
        continue;
      }

      if(inst instanceof cs.Nop)
        continue;

      assert.fail(inst.constructor.name);
    }
  }
  
  getOutput(){
    return this.io.getOutput();
  }
}

class Value extends O.Stringifiable{
  #id = null;

  constructor(base=null, obj=null){
    super();

    this.base = base !== null ? base.copy() : null;
    this.baseId = base !== null ? base.id : '.';
    this.obj = obj !== null ? Object.assign(O.obj(), obj) : O.obj();
  }

  get id(){
    if(this.#id === null)
      this.#id = this.toString();

    return this.#id;
  }

  eq(val){
    return val.id === this.id;
  }

  copy(){
    return new Value(this.base, this.obj);
  }

  get(val){
    const {base, obj} = this;
    const {id} = val;

    if(id in obj) return obj[id];
    if(base !== null) return base;
    return val;
  }

  set(key, val){
    const {base, baseId, obj} = this;
    const {id} = val;

    if(id === (base !== null ? baseId : key)){
      if(key in obj){
        delete obj[key];
        this.#id = null;
      }

      return;
    }

    obj[key] = val.copy();
    this.#id = null;
  }

  toStr(){
    const {obj} = this;
    const keys = O.keys(obj);
    const arr = [];

    arr.push('(', this.baseId);

    if(keys.length !== 0){
      O.sortAsc(keys);
      arr.push('; ');

      for(let i = 0; i !== keys.length; i++){
        const key = keys[i];
        if(i !== 0) arr.push(', ');
        arr.push(key, ' -> ', obj[key]);
      }
    }

    arr.push(')');

    return arr;
  }

  toString(){
    if(this.#id !== null)
      return this.#id;

    return super.toString();
  }
}

module.exports = Engine;