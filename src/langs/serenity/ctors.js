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

  entry = null;

  natives = O.nproto({
    protos: O.obj(),
  });

  symbols = O.obj();
  ints = O.obj();
  chars = O.obj();

  constructor(ast){
    assert(!Program.astProgs.has(ast));
    Program.astProgs.set(ast, this);

    const {natives} = this;

    this.ast = ast;
    this.null = new Object(this, Object.kNull);

    this.createProto('base');

    const psInfo = [
      'base', 'obj',
      'base', 'int',
      'base', 'char',
      'base', 'arr',
      'arr', 'str',
    ];

    for(let i = 0; i !== psInfo.length; i += 2)
      this.createProto(psInfo[i], psInfo[i + 1]);
  }

  createObj(proto=null, kvPairs=null){
    return new Object(this, proto, kvPairs);
  }

  createProto(parent, name=null){
    const ps = this.natives.protos;

    if(name === null){
      assert(!(parent in ps));

      name = parent;
      parent = null;
    }else{
      assert(parent in ps);
      assert(!(name in ps));

      parent = ps[parent];
    }

    return ps[name] = this.createObj(ps[parent]).setInfo(`proto ${name}`);
  }

  getProto(name){
    const {protos} = this.natives;
    assert(name in protos);
    return protos[name];
  }

  getSymbol(name){
    const {symbols} = this;

    if(name in symbols)
      return symbols[name];

    const sym = new Symbol(this, name);
    symbols[name] = sym;

    return sym;
  }

  getInt(val){
    const {ints} = this;

    if(val in ints)
      return ints[val];

    const sym = new Integer(this, val);
    ints[val] = sym;

    return sym;
  }
}

class Object{
  static kNull = global.Symbol('null');

  info = null;

  kvMap = new Map();
  keys = new Set();

  constructor(prog, proto=null, kvPairs=null){
    this.prog = prog;

    this.proto = (
      proto !== null ?
        proto === Object.kNull ?
          this.setInfo('null') : proto :
        prog.null
    );

    if(kvPairs !== null)
      for(const [key, val] of kvPairs)
        this.setl(key, val);
  }

  setInfo(info){
    this.info = info;
    return this;
  }

  makeEntry(){
    const {prog} = this;
    prog.entry = this;
    return prog;
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

    if(keys.has(key))
      keys.delete(key);
    
    keys.add(key);
  }

  deletel(key){
    const {kvMap, keys} = this;

    if(!kvMap.has(key)) return;

    kvMap.delete(key);
    keys.delete(key);
  }
}

class Symbol extends Object{
  constructor(prog, name){
    super(prog).setInfo(`sym ${name}`);
    this.name = name;
  }
}

class Integer extends Object{
  constructor(prog, val){
    super(prog).setInfo(`int ${val}`);
    this.val = val;
  }
}

module.exports = {
  Program,
  Object,
  Symbol,
  Integer,
};