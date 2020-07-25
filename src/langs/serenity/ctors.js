'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');

class Program{
  static astProgs = new WeakMap();

  static fromAst(ast){
    return Program.astProgs.get(ast) || new Program(ast);
  }

  entry = null;
  output = null;

  objs = O.nproto({
    null: null,
    root: null,
    input: null,

    protos: O.obj(),
    symbols: O.obj(),
    ints: O.obj(),
    chars: O.obj(),
    strs: O.obj(),

    insts: new Map(),
  });

  protos = this.objs.protos;
  symbols = this.objs.symbols;
  ints = this.objs.ints;
  chars = this.objs.chars;
  strs = this.objs.strs;
  insts = this.objs.insts;

  constructor(ast){
    assert(!Program.astProgs.has(ast));
    Program.astProgs.set(ast, this);

    this.ast = ast;

    const {objs} = this;

    objs.null = new Object(this, Object.kNull);

    // Create prototypes
    {
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
    }

    // Create root and main stack
    {
      objs.root = this.createObj([
        ['mainStack', this.createArr()],
      ]);
    }

    // Initialize instructions
    {
      const instsInfo = {
        nop: () => {},
        plus: () => {
          const {stack} = this;
          stack.push(stack.pop().intVal);
        },
        minus: () => {
          const {stack} = this;
          stack.push(-stack.pop().intVal);
        },
        not: () => {
          const {stack} = this;
          stack.push(!stack.pop().intVal);
        },
        neg: () => {
          const {stack} = this;
          stack.push(~stack.pop().intVal);
        },
        inc: () => {
          const {stack} = this;
          stack.push(stack.pop().intVal + 1n);
        },
        dec: () => {
          const {stack} = this;
          stack.push(stack.pop().intVal - 1n);
        },
        and: () => {
          const {stack} = this;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          stack.push(a & b);
        },
        or: () => {
          const {stack} = this;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          stack.push(a | b);
        },
        xor: () => {
          const {stack} = this;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          stack.push(a ^ b);
        },
        shl: () => {
          const {stack} = this;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          stack.push(a << b);
        },
        shr: () => {
          const {stack} = this;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          stack.push(a >> b);
        },
        add: () => {
          const {stack} = this;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          stack.push(a + b);
        },
        sub: () => {
          const {stack} = this;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          stack.push(a - b);
        },
        mul: () => {
          const {stack} = this;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          stack.push(a * b);
        },
        div: () => {
          const {stack} = this;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          stack.push(b ? a / b : this.null);
        },
        mod: () => {
          const {stack} = this;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          stack.push(b ? a % b : this.null);
        },
        exp: () => {
          const {stack} = this;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;

          stack.push(
            b > 0n || (b === 0n && a !== 0n) ?
              a ** b : this.null
          );
        },
        lt: () => {
          const {stack} = this;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          stack.push(a < b);
        },
        gt: () => {
          const {stack} = this;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          stack.push(a > b);
        },
        le: () => {
          const {stack} = this;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          stack.push(a <= b);
        },
        ge: () => {
          const {stack} = this;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          stack.push(a >= b);
        },
        push: () => {
          const {frame} = this;
          const stack = frame.get('stack');
          const instPtr = frame.get('inst').intVal;
          const func = frame.get('func');
          const insts = func.get('insts');
          const val = insts.get(instPtr);

          frame.set('inst', instPtr + 1n);
          stack.push(val);
        },
        pop: () => {
          const {stack} = this;
          const a = stack.pop().intVal;
          stack.splice(stack.get('length').intVal - a - 1n);
        },
        disc: () => {
          const {stack} = this;
          stack.pop();
        },
        move: () => {
          const {stack} = this;
          const a = stack.pop().intVal;
          stack.push(stack.splice(stack.get('length').intVal - a - 1n));
        },
        copy: () => {
          const {stack} = this;
          const a = stack.pop().intVal;
          stack.push(stack.get(stack.get('length').intVal - a - 1n));
        },
        dupe: () => {
          const {stack} = this;
          stack.push(stack.last);
        },
        swap: () => {
          const {stack} = this;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;

          const len1 = stack.get('length').intVal - 1n;
          const i = len1 - a;
          const j = len1 - b;
          const c = stack.get(i);
          const d = stack.get(j);

          stack.set(i, d);
          stack.set(j, c);
        },
        eq: () => {
          const {stack} = this;
          const b = stack.pop();
          const a = stack.pop();
          stack.push(a === b);
        },
        neq: () => {
          const {stack} = this;
          const b = stack.pop();
          const a = stack.pop();
          stack.push(a !== b);
        },
        has: () => {
          const {stack} = this;
          const b = stack.pop();
          const a = stack.pop();
          stack.push(Boolean(a.has(b)));
        },
        get: () => {
          const {stack} = this;
          const b = stack.pop();
          const a = stack.pop();
          stack.push(a.get(b));
        },
        set: () => {
          const {stack} = this;
          const b = stack.pop();
          const a = stack.pop();
          stack.pop().set(a, b);
        },
        setk: () => {
          const {stack} = this;
          const b = stack.pop();
          const a = stack.pop();
          stack.last.set(a, b);
        },
        delete: () => {
          const {stack} = this;
          const a = stack.pop();
          stack.pop().delete(a);
        },
        deletek: () => {
          const {stack} = this;
          const a = stack.pop();
          stack.last.delete(a);
        },
        hasl: () => {
          const {stack} = this;
          const b = stack.pop();
          const a = stack.pop();
          stack.push(Boolean(a.hasl(b)));
        },
        getl: () => {
          const {stack} = this;
          const b = stack.pop();
          const a = stack.pop();
          stack.push(a.getl(b));
        },
        setl: () => {
          const {stack} = this;
          const b = stack.pop();
          const a = stack.pop();
          stack.pop().setl(a, b);
        },
        setlk: () => {
          const {stack} = this;
          const b = stack.pop();
          const a = stack.pop();
          stack.last.setl(a, b);
        },
        deletel: () => {
          const {stack} = this;
          const a = stack.pop();
          stack.pop().deletel(a);
        },
        deletelk: () => {
          const {stack} = this;
          const a = stack.pop();
          stack.last.deletel(a);
        },
        getProto: () => {
          const {stack} = this;
          const a = stack.pop();
          stack.push(a.proto);
        },
        setProto: () => {
          const {stack} = this;
          const b = stack.pop();
          const a = stack.pop();
          a.proto = b;
        },
        keys1: () => {
          const {stack} = this;
          const a = stack.pop();
          stack.push(this.createArr(a.kvMap.keys()));
        },
        keys2: () => {
          const {stack} = this;
          const a = stack.pop();
          stack.push(this.createArr(a.keys));
        },
        prod: () => {
          const {stack} = this;
          const b = stack.pop();
          const a = stack.pop();
          stack.push(a.clone().prod(b));
        },
        'prod*': () => {
          const {stack} = this;
          const a = stack.pop();
          this.prodAll(new Map(a.kvMap));
        },
        raw: () => {
          const {stack} = this;
          const a = stack.pop();
          stack.push(this.createRaw(a));
        },
        obj: () => {
          const {stack} = this;
          stack.push(this.createObj());
        },
        int: () => {
          const {stack} = this;
          stack.push(stack.pop().intVal);
        },
        char: () => {
          const {stack} = this;
          const a = stack.pop();
          stack.push(this.getChar(a.intVal & 0xFFn));
        },
        arr: () => {
          const {stack} = this;
          const len = stack.pop().intVal;
          if(len < 0n) return stack.push(this.null);

          const elems = [];

          for(let i = 0n; i !== len; i++)
            elems.push(stack.pop());

          stack.push(this.createArr(elems.reverse()));
        },
        str: () => {
          const {stack} = this;
          const len = stack.pop().intVal;
          if(len < 0n) return stack.push(this.null);

          const elems = [];

          for(let i = 0n; i !== len; i++)
            elems.push(Number(stack.pop().intVal & 0xFFn));

          stack.push(new String(this, Buffer.from(elems.reverse())));
        },
        clone: () => {
          const {stack} = this;
          const a = stack.pop();
          stack.push(a.clone());
        },
        pusha: () => {
          const {stack} = this;
          const b = stack.pop();
          const a = stack.pop();
          a.push(b);
        },
        pushk: () => {
          const {stack} = this;
          const a = stack.pop();
          stack.last.push(a);
        },
        popa: () => {
          const {stack} = this;
          const a = stack.pop();
          stack.push(a.pop());
        },
        null: () => {
          const {stack} = this;
          stack.push(this.null);
        },
        root: () => {
          const {stack} = this;
          stack.push(this.root);
        },
        mainStack: () => {
          const {stack} = this;
          stack.push(this.mainStack);
        },
        frame: () => {
          const {stack} = this;
          stack.push(this.frame);
        },
        func: () => {
          const {stack} = this;
          stack.push(this.func);
        },
        scope: () => {
          const {stack} = this;
          stack.push(this.scope);
        },
        this: () => {
          const {stack} = this;
          stack.push(this.this);
        },
        getv: () => {
          const {stack} = this;
          const a = stack.pop();
          stack.push(this.scope.get(a));
        },
        setv: () => {
          const {stack} = this;
          const b = stack.pop();
          const a = stack.pop();
          this.scope.set(a, b);
        },
        setvk: () => {
          const {stack} = this;
          const b = stack.pop();
          const a = stack.pop();
          this.scope.set(a, b);
          stack.push(b);
        },
        getvl: () => {
          const {stack} = this;
          const a = stack.pop();
          stack.push(this.scope.getl(a));
        },
        setvl: () => {
          const {stack} = this;
          const b = stack.pop();
          const a = stack.pop();
          this.scope.setl(a, b);
        },
        setvlk: () => {
          const {stack} = this;
          const b = stack.pop();
          const a = stack.pop();
          this.scope.setl(a, b);
          stack.push(a);
        },
        enter: () => {
          const {frame} = this;
          frame.scope = this.createRaw(frame.scope);
        },
        leave: () => {
          const {frame} = this;
          frame.scope = frame.scope.proto;
        },
        bind: () => {
          const {stack} = this;
          stack.last.set('scope', this.scope);
        },
        cbs: () => {
          instsInfo.clone();
          instsInfo.bind();
          instsInfo.setv();
        },
        arg: () => {
          const {stack} = this;
          stack.push(this.createRaw(stack.last.get('scope')));
        },
        args: () => {
          const {stack} = this;
          const len = stack.pop().intVal;
          if(len < 0n) return stack.push(this.null);

          const elems = [];

          for(let i = 0n; i !== len; i++)
            elems.push(stack.pop());

          const arr = this.createArr(elems.reverse());
          arr.proto = stack.last.get('scope');

          stack.push(arr);
        },
        crg: () => {
          instsInfo.args();
          instsInfo.call();
        },
        jz: () => {
          const {frame} = this;
          const stack = frame.get('stack');
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          if(a === 0n) frame.set('inst', b);
        },
        jnz: () => {
          const {frame} = this;
          const stack = frame.get('stack');
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          if(a !== 0n) frame.set('inst', b);
        },
        jmp: () => {
          const {frame} = this;
          const stack = frame.get('stack');
          const a = stack.pop().intVal;
          frame.set('inst', a);
        },
        alt: () => {
          const {frame} = this;
          const stack = frame.get('stack');
          const c = stack.pop().intVal;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          frame.set('inst', a ? b : c);
        },
        call: () => {
          const {stack} = this;
          const b = stack.pop();
          const a = stack.pop();
          a.call(b);
        },
        method: () => {
          const {stack} = this;
          const c = stack.pop();
          const b = stack.pop();
          const a = stack.pop();
          c.set('this', b);
          a.call(c);
        },
        new: () => {
          const {stack} = this;
          const b = stack.pop();
          const a = stack.pop();
          b.set('this', this.createRaw(a.get('prototype')));
          a.call(b);
        },
        ret: () => {
          const a = this.stack.last;
          this.mainStack.pop();
          this.stack.push(a);
        },
        retv: () => {
          this.mainStack.pop();
        },
        in: () => {
          const {stack} = this;
          stack.push(this.input);
        },
        out: () => {
          const {stack} = this;
          const val = stack.last;
          const len = val.get('length').intVal;

          if(len >= 0n){
            const out = [];

            for(let i = 0n; i !== len; i++)
              out.push(Number(val.get(i).intVal & 0xFFn));

            this.output = Buffer.from(out);
          }else{
            this.output = Buffer.from('');
          }
        },
      };

      const {insts} = objs;

      for(const instName of O.keys(instsInfo))
        insts.set(this.getSym(instName), instsInfo[instName]);
    }
  }

  run(input){
    const {entry, objs} = this;
    const {insts} = objs;

    this.entry = null;
    entry.call(this.createRaw(objs.root));

    objs.input = new String(this, input);

    while(this.output === null){
      const {frame} = this;

      const func = frame.get('func');
      const instPtr = frame.get('inst').intVal;
      const finsts = func.get('insts');

      if(instPtr >= finsts.get('length').intVal){
        insts.get(this.getSym('retv'))();
        continue;
      }

      const inst = finsts.get(instPtr);
      frame.set('inst', instPtr + 1n);

      const instf = insts.get(inst);

      if(!instf){
        frame.get('stack').push(inst);
        continue;
      }

      instf();
    }

    return this.output;
  }

  prodAll(pmap){
    const seen = new Set();
    const stack = [];

    const push = obj => {
      if(seen.has(obj)) return obj;

      seen.add(obj);
      stack.push(obj);

      return obj;
    };

    const mapAndPush = obj => {
      if(typeof obj === 'function')
        return obj;

      if(pmap.has(obj))
        obj = pmap.get(obj);

      return push(obj);
    };

    mapAndPush(this.objs);

    while(stack.length !== 0){
      const obj = stack.pop();

      if(obj instanceof Object){
        obj.prod(pmap);

        push(obj.proto);

        for(const [key, val] of obj.kvMap){
          push(key);
          push(val);
        }

        continue;
      }

      if(obj instanceof Map){
        for(const [key, val] of obj)
          obj.set(key, mapAndPush(val));

        continue;
      }

      assert(O.proto(obj) === null);

      for(const key in obj)
        obj[key] = mapAndPush(obj[key]);
    }
  }

  get null(){ return this.objs.null; }
  set null(obj){ this.objs.null = obj; }

  get root(){ return this.objs.root; }
  set root(obj){ this.objs.root = obj; }

  get input(){ return this.objs.input; }
  set input(str){ this.objs.input = input; }

  get mainStack(){ return this.root.get('mainStack'); }
  get frame(){ return this.mainStack.last; }
  get func(){ return this.frame.get('func'); }
  get scope(){ return this.frame.get('scope'); }
  get stack(){ return this.frame.get('stack'); }
  get this(){ return this.scope.get('this'); }

  createProto(parent, name){
    const ps = this.protos;
    assert(!(name in ps));

    if(parent !== null){
      assert(parent in ps);
      parent = ps[parent];
    }else{
      parent = this.null;
    }

    return ps[name] = this.createRaw(ps[parent]);
  }

  getProto(name){
    const ps = this.protos;
    assert(name in ps);
    return ps[name];
  }

  getNative(container, ctor, id){
    if(id in container){
      const obj = container[id];
      assert(obj instanceof Object, global.String(obj));
      return obj;
    }

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

  createArrLab(arr){
    const labs = O.obj();
    let labsNum = 0;

    arr = arr.filter((elem, index) => {
      if(!(elem instanceof Label)) return 1;
      if(elem.type !== 0) return 1;

      const {name} = elem;

      if(name in labs)
        esolangs.err(`Duplicate label ${O.sf(name)}`);

      labs[name] = this.getInt(BigInt(index - labsNum++));

      return 0;
    });

    arr = arr.map(elem => {
      if(!(elem instanceof Label)) return elem;

      const {name} = elem;

      if(!(name in labs))
        esolangs.err(`Undefined label ${O.sf(name)}`);

      return labs[name];
    });

    return this.createArr(arr);
  }

  createStackFrame(func, scope){
    const frame = this.createObj([
      ['func', func],
      ['inst', 0n],
      ['scope', scope],
      ['stack', this.createArr()],
    ]);

    return frame;
  }
}

class Object{
  static kNull = global.Symbol('null');

  #prog = null;
  #proto = null;

  kvMap = new Map();
  keys = new Set();

  constructor(prog, proto=null, kvPairs=null){
    this.#prog = prog;

    this.#proto = (
      proto !== null ?
        proto === Object.kNull ? this : proto :
        prog.null
    );

    if(kvPairs !== null)
      for(const [key, val] of kvPairs)
        this.setl(key, val);
  }

  get prog(){ return this.#prog; }
  get proto(){ return this.#proto; }

  set proto(proto){
    const n = this.prog.null;
    const chain = new Set([this]);

    this.#proto = proto;

    for(let prev = this, obj = proto; obj !== n; prev = obj, obj = obj.#proto){
      if(chain.has(obj))
        return prev.#proto = n;

      chain.add(obj);
    }
  }

  get intVal(){ return 0n; }

  toObj(val){
    const {prog} = this;
    let obj = null;

    convert: {
      if(typeof val === 'object') { obj = val; break convert; }
      if(typeof val === 'string') { obj = prog.getSym(val); break convert; }
      if(typeof val === 'bigint') { obj = prog.getInt(val); break convert; }
      if(typeof val === 'boolean') { obj = prog.getInt(val ? 1n : 0n); break convert; }
      assert.fail(typeof val);
    }

    assert(obj !== undefined, val);

    return obj;
  }

  makeEntry(){
    const {prog} = this;
    prog.entry = this;
    return prog;
  }

  call(scope){
    const {prog} = this;
    const {root} = prog;

    const stack = root.get(prog.getSym('mainStack'));
    stack.push(prog.createStackFrame(this, scope));

    return this;
  }

  get last(){
    return this.get(this.get('length').intVal - 1n);
  }

  set last(val){
    this.set(this.get('length').intVal - 1n, val);
  }

  push(val){
    const {prog} = this;

    const len = this.get('length');
    const lenNew = len.intVal + 1n;

    this.set(len, val);
    this.set('length', lenNew);
  }

  pop(){
    const {prog} = this;
    
    const len = this.get('length');
    const lenNew = len.intVal - 1n;

    this.set('length', lenNew);

    const elem = this.get(lenNew);
    this.delete(lenNew);

    return elem;
  }

  splice(index){
    const {prog} = this;
    const len = this.get('length').intVal;
    if(index >= len) return prog.null;

    const val = this.get(index);
    const len1 = len - 1n;

    for(let i = index; i !== len1; i++)
      this.set(i, this.get(i + 1n));

    this.pop();

    return val;
  }

  has(key){
    assert(key !== undefined);
    const {prog} = this;
    const n = prog.null;

    key = this.toObj(key);

    for(let obj = this; obj !== n; obj = obj.#proto)
      if(obj.hasl(key))
        return 1;

    return 0;
  }

  get(key){
    assert(key !== undefined);
    const {prog} = this;
    const n = prog.null;

    const KEY_ORIG = key;
    key = this.toObj(key);

    for(let obj = this; obj !== n; obj = obj.#proto)
      if(obj.hasl(key))
        return obj.getl(key);

    return n;
  }

  set(key, val){
    assert(key !== undefined);
    const {prog} = this;
    const n = prog.null;

    key = this.toObj(key);
    val = this.toObj(val);

    for(let obj = this; obj !== n; obj = obj.#proto)
      if(obj.hasl(key))
        return obj.setl(key, val);

    this.setl(key, val);
  }

  delete(key){
    assert(key !== undefined);
    const {prog} = this;
    const n = prog.null;

    key = this.toObj(key);

    for(let obj = this; obj !== n; obj = obj.#proto)
      if(obj.hasl(key))
        return obj.deletel(key);
  }

  hasl(key){
    assert(key !== undefined);
    const {prog} = this;

    key = this.toObj(key);

    return this.kvMap.has(key);
  }

  getl(key){
    assert(key !== undefined);
    const {prog} = this;

    key = this.toObj(key);

    return this.kvMap.get(key) || this.prog.null;
  }

  setl(key, val){
    assert(key !== undefined);
    const {prog, kvMap, keys} = this;

    key = this.toObj(key);
    val = this.toObj(val);

    kvMap.set(key, val);

    if(keys.has(key))
      keys.delete(key);
    
    keys.add(key);
  }

  deletel(key){
    assert(key !== undefined);
    const {prog, kvMap, keys} = this;

    key = this.toObj(key);

    kvMap.delete(key);
    keys.delete(key);
  }

  touch(key){
    assert(key !== undefined);
    const {keys} = this;

    keys.delete(key);
    keys.add(key);
  }

  clone(){
    const obj = new Object(this.prog);

    obj.proto = this.proto;
    obj.kvMap = new Map(this.kvMap);
    obj.keys = new Set(this.keys);

    return obj;
  }

  assign(obj){
    this.proto = obj.proto;
    this.kvMap = new Map(obj.kvMap);
    this.keys = new Set(obj.keys);

    return this;
  }

  prod(pmap){
    const get = obj => pmap.get(obj) || obj;

    const objNew = this.prog.createRaw(get(this.proto));

    for(const [key, val] of this.kvMap)
      objNew.setl(get(key), get(val));

    for(const key of this.keys)
      objNew.touch(key);

    return this.assign(objNew);
  }
}

class Symbol extends Object{
  constructor(prog, name){
    super(prog, prog.getProto('sym'));
    this.name = name;
  }
}

class Integer extends Object{
  constructor(prog, val){
    super(prog, prog.getProto('int'));
    this.val = val;
  }

  get intVal(){ return this.val; }
}

class Character extends Object{
  constructor(prog, code){
    code = BigInt(code);
    super(prog, prog.getProto('char'));
    this.code = code;
  }

  get intVal(){ return BigInt(this.code); }
}

class Array extends Object{
  constructor(prog, elems=null){
    super(prog, prog.getProto('arr'));

    this.setl('length', 0n);

    if(elems !== null)
      for(const elem of elems)
        this.push(elem);
  }
}

class String extends Object{
  constructor(prog, buf=null){
    super(prog, prog.getProto('str'));

    this.setl('length', 0n);

    if(buf !== null)
      for(const byte of buf)
        this.push(prog.getChar(byte));
  }
}

class Label{
  constructor(name, type){
    if(name.includes('*'))
      esolangs.err(`Invalid label name ${O.sf(name)}`);

    this.name = name;
    this.type = type;
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
  Label,
};