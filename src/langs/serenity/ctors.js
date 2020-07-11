'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

class Program{
  static astProgs = new WeakMap();

  static fromAst(ast){
    return Program.astProgs.get(ast) || new Program(ast);
  }

  elem = null;

  constructor(ast){
    assert(!Program.astProgs.has(ast));
    Program.astProgs.set(ast, this);

    this.ast = ast;

    this.null = new Object(ast, Object.kNull);
  }
}

class Object{
  static kNull = Symbol('null');

  kvMap = new Map();
  keys = new Set();

  constructor(ast, proto=null, kvPairs=null){
    const prog = this.prog = Program.fromAst(ast);

    this.proto = (
      proto !== null ?
        proto === Object.kNull ?
          this : proto :
        prog.null
    );

    if(kvPairs !== null)
      for(const [key, val] of kvPairs)
        this.setl(key, val);
  }

  setProto(proto){
    const n = this.prog.null;
    const chain = new Set([this]);

    this.proto = proto;

    for(let prev = this, obj = proto; obj !== n; prev = obj, obj = obj.proto){
      if(chain.has(obj))
        return prev.setProto(n);

      chain.add(obj);
    }
  }

  has(key){
    const n = this.prog.null;

    for(let obj = this; obj !== n; obj = obj.proto)
      if(obj.has(key))
        return 1;

    return 0;
  }

  get(key){
    const n = this.prog.null;

    for(let obj = this; obj !== n; obj = obj.proto)
      if(obj.has(key))
        return obj.getl(key);

    return n;
  }

  set(key, val){
    const n = this.prog.null;

    for(let obj = this; obj !== n; obj = obj.proto)
      if(obj.has(key))
        return obj.setl(key, val);

    this.setl(key, val);
  }

  delete(key){
    const n = this.prog.null;

    for(let obj = this; obj !== n; obj = obj.proto)
      if(obj.has(key))
        return obj.deletel(key);
  }

  hasl(key){
    return this.kvMap.has(key);
  }

  getl(key){
    return this.kvMap.get(key) || this.prog.null;
  }

  setl(key, val){
    const {kvMap, keys} = this;

    kvMap.set(key, val);

    if(keys.has(key)){
      keys.delete(key);
      keys.add(key);
    }
  }

  deletel(key){
    const {kvMap, keys} = this;

    if(!kvMap.has(key)) return;

    kvMap.delete(key);
    keys.delete(key);
  }
}

module.exports = {
  Program,
  Object,
};