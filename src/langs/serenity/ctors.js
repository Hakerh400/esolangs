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

  objs = O.nproto({
    root: null,
    null: null,

    protos: O.obj(),
    symbols: O.obj(),
    ints: O.obj(),
    chars: O.obj(),
    strs: O.obj(),
  });

  protos = this.objs.protos;
  symbols = this.objs.symbols;
  ints = this.objs.ints;
  chars = this.objs.chars;
  strs = this.objs.strs;

  constructor(ast){
    assert(!Program.astProgs.has(ast));
    Program.astProgs.set(ast, this);

    this.ast = ast;

    const {objs} = this;

    objs.null = new Object(this, Object.kNull);

    const psInfo = [
      null, 'base',
      'base', 'sym',
      'base', 'int',
      'base', 'char',
      'base', 'obj',
      'obj', 'arr',
      'arr', 'str',
    ];

    for(let i = 0; i !== psInfo.length; i += 2)
      this.createProto(psInfo[i], psInfo[i + 1]);

    objs.root = this.createObj([
      ['stack', this.createArr()],
    ]);
  }

  get root(){ return this.objs.root; }
  set root(obj){ this.objs.root = obj; }

  get null(){ return this.objs.null; }
  set null(obj){ this.objs.null = obj; }

  get zero(){ return this.getInt(0n); }

  createProto(parent, name){
    const ps = this.protos;
    assert(!(name in ps));

    if(parent !== null){
      assert(parent in ps);
      parent = ps[parent];
    }else{
      parent = this.null;
    }

    return ps[name] = this.createRaw(ps[parent]).setInfo(`proto ${name}`);
  }

  getProto(name){
    const ps = this.protos;
    assert(name in ps);
    return ps[name];
  }

  getNative(container, ctor, id){
    if(id in container)
      return container[id];

    const obj = new ctor(this, id);
    container[id] = obj;

    return obj;
  }

  getSym(id){ return this.getNative(this.symbols, Symbol, id); }
  getInt(id){ return this.getNative(this.ints, Integer, id); }
  getChar(id){ return this.getNative(this.chars, Character, id); }
  getStr(id){ return this.getNative(this.strs, String, id); }

  getIdent(id){
    if(/^[+\-]?(?:[0-9]+|0x[0-9a-f]+|0b[01]+|0o[0-7]+)$/i.test(id))
      return this.getInt(BigInt(id));

    return this.getSym(id);
  }

  createRaw(proto=null, kvPairs=null){
    return new Object(this, proto, kvPairs);
  }

  createObj(kvPairs=null){
    return new Object(this, this.getProto('obj'), kvPairs);
  }

  createArr(elems=null){
    return new Array(this, elems);
  }

  createStackFrame(func){
    const frame = this.createObj([
      ['func', func],
      ['inst', this.zero],
      ['scope', this.createRaw(func.get('scope'))],
      ['stack', this.createArr()],
    ]);

    return frame;
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

  get intVal(){ return 0n; }
  get charCode(){ return 0n; }

  call(){
    const {prog} = this;
    const {root} = prog;

    const stack = root.get(prog.getSym('stack'));
    stack.push(prog.createStackFrame(this));

    return this;
  }

  push(obj){
    const {prog} = this;

    const len = this.get('length');
    const lenNew = prog.getInt(len.intVal + 1n);

    this.set(len, obj);
    this.set('length', lenNew);
  }

  pop(){
    const {prog} = this;
    
    const len = this.get('length');
    const lenNew = prog.getInt(len.intVal - 1n);

    this.set('length', lenNew);

    const elem = this.get(lenNew);
    this.delete(lenNew);

    return elem;
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
    const {prog} = this;
    const n = prog.null;

    if(typeof key === 'string')
      key = prog.getSym(key);

    for(let obj = this; obj !== n; obj = obj.proto)
      if(obj.hasl(key))
        return 1;

    return 0;
  }

  get(key){
    const {prog} = this;
    const n = prog.null;

    if(typeof key === 'string')
      key = prog.getSym(key);

    for(let obj = this; obj !== n; obj = obj.proto)
      if(obj.hasl(key))
        return obj.getl(key);

    return n;
  }

  set(key, val){
    const {prog} = this;
    const n = prog.null;

    if(typeof key === 'string')
      key = prog.getSym(key);

    for(let obj = this; obj !== n; obj = obj.proto)
      if(obj.hasl(key))
        return obj.setl(key, val);

    this.setl(key, val);
  }

  delete(key){
    const {prog} = this;
    const n = prog.null;

    if(typeof key === 'string')
      key = prog.getSym(key);

    for(let obj = this; obj !== n; obj = obj.proto)
      if(obj.hasl(key))
        return obj.deletel(key);
  }

  hasl(key){
    const {prog} = this;

    if(typeof key === 'string')
      key = prog.getSym(key);

    return this.kvMap.has(key);
  }

  getl(key){
    const {prog} = this;

    if(typeof key === 'string')
      key = prog.getSym(key);

    return this.kvMap.get(key) || this.prog.null;
  }

  setl(key, val){
    const {prog, kvMap, keys} = this;

    if(typeof key === 'string')
      key = prog.getSym(key);

    kvMap.set(key, val);

    if(keys.has(key))
      keys.delete(key);
    
    keys.add(key);
  }

  deletel(key){
    const {prog, kvMap, keys} = this;

    if(typeof key === 'string')
      key = prog.getSym(key);

    if(!kvMap.has(key)) return;

    kvMap.delete(key);
    keys.delete(key);
  }
}

class Symbol extends Object{
  constructor(prog, name){
    super(prog, prog.getProto('sym')).setInfo(`sym ${name}`);
    this.name = name;
  }
}

class Integer extends Object{
  constructor(prog, val){
    super(prog, prog.getProto('int')).setInfo(`int ${val}`);
    this.val = val;
  }

  get intVal(){ return this.val; }
}

class Character extends Object{
  constructor(prog, code){
    super(prog, prog.getProto('char')).setInfo(`char ${code}`);
    this.code = code;
  }

  get charCode(){ return this.code; }
}

class Array extends Object{
  constructor(prog, elems=null){
    super(prog, prog.getProto('arr')).setInfo(`arr`);

    this.setl('length', prog.zero);

    if(elems !== null)
      for(const elem of elems)
        this.push(elem);
  }
}

class String extends Object{
  constructor(prog, str=null){
    super(prog, prog.getProto('str')).setInfo(`str ${O.sf(code)}`);

    this.setl('length', prog.zero);

    if(str !== null)
      for(const char of str)
        this.push(prog.getChar(O.cc(char)));
  }
}

module.exports = {
  Program,
  Object,
  Symbol,
  Integer,
  Character,
  Array,
  String,
};