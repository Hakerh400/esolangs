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

  gcEnabled = 0;

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
      ]).setInfo('root');
    }

    // Initialize instructions
    {
      const instsInfo = {
        plus: () => {
          const stack = this.stack;
          stack.push(this.getInt(stack.pop().intVal));
        },
        minus: () => {
          const stack = this.stack;
          stack.push(this.getInt(-stack.pop().intVal));
        },
        not: () => {
          const stack = this.stack;
          stack.push(this.getInt(stack.pop().intVal ? 0n : 1n));
        },
        neg: () => {
          const stack = this.stack;
          stack.push(this.getInt(~stack.pop().intVal));
        },
        inc: () => {
          const stack = this.stack;
          stack.push(this.getInt(stack.pop().intVal + 1n));
        },
        dec: () => {
          const stack = this.stack;
          stack.push(this.getInt(stack.pop().intVal - 1n));
        },
        and: () => {
          const stack = this.stack;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          stack.push(this.getInt(a & b));
        },
        or: () => {
          const stack = this.stack;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          stack.push(this.getInt(a | b));
        },
        xor: () => {
          const stack = this.stack;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          stack.push(this.getInt(a ^ b));
        },
        shl: () => {
          const stack = this.stack;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          stack.push(this.getInt(a << b));
        },
        shr: () => {
          const stack = this.stack;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          stack.push(this.getInt(a >> b));
        },
        add: () => {
          const stack = this.stack;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          stack.push(this.getInt(a + b));
        },
        sub: () => {
          const stack = this.stack;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          stack.push(this.getInt(a - b));
        },
        mul: () => {
          const stack = this.stack;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          stack.push(this.getInt(a * b));
        },
        div: () => {
          const stack = this.stack;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          stack.push(b ? this.getInt(a / b) : this.null);
        },
        exp: () => {
          const stack = this.stack;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;

          stack.push(
            b > 0n || b === 0n && a !== 0n ?
              this.getInt(a ** b) : this.null
          );
        },
        lt: () => {
          const stack = this.stack;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          stack.push(this.getInt(a < b ? 1n : 0n));
        },
        gt: () => {
          const stack = this.stack;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          stack.push(this.getInt(a > b ? 1n : 0n));
        },
        le: () => {
          const stack = this.stack;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          stack.push(this.getInt(a <= b ? 1n : 0n));
        },
        ge: () => {
          const stack = this.stack;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          stack.push(this.getInt(a >= b ? 1n : 0n));
        },
        push: () => {
          const frame = this.frame;
          const stack = frame.get('stack');
          const instPtr = frame.get('inst').intVal;
          const func = frame.get('func');
          const insts = func.get('insts');
          const val = insts.get(instPtr);

          frame.set('inst', this.getInt(instPtr + 1n));
          stack.push(val);
        },
        pop: () => {
          const stack = this.stack;
          const a = stack.pop().intVal;
          stack.splice(stack.get('length').intVal - a - 1n);
        },
        disc: () => {
          const stack = this.stack;
          stack.pop();
        },
        move: () => {
          const stack = this.stack;
          const a = stack.pop().intVal;
          stack.push(stack.splice(stack.get('length').intVal - a - 1n));
        },
        copy: () => {
          const stack = this.stack;
          const a = stack.pop().intVal;
          stack.push(stack.get(this.getInt(stack.get('length').intVal - a - 1n)));
        },
        dupe: () => {
          const stack = this.stack;
          stack.push(stack.last);
        },
        swap: () => {
          const stack = this.stack;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;

          const len1 = stack.get('length').intVal - 1n;
          const i = this.getInt(len1 - a);
          const j = this.getInt(len1 - b);
          const c = stack.get(i);
          const d = stack.get(j);

          stack.set(i, d);
          stack.set(j, c);
        },
        eq: () => {
          const stack = this.stack;
          const b = stack.pop();
          const a = stack.pop();
          stack.push(this.getInt(a === b ? 1n : 0n));
        },
        neq: () => {
          const stack = this.stack;
          const b = stack.pop();
          const a = stack.pop();
          stack.push(this.getInt(a !== b ? 1n : 0n));
        },
        has: () => {
          const stack = this.stack;
          const b = stack.pop();
          const a = stack.pop();
          stack.push(this.getInt(a.has(b) ? 1n : 0n));
        },
        get: () => {
          const stack = this.stack;
          const b = stack.pop();
          const a = stack.pop();
          stack.push(a.get(b));
        },
        set: () => {
          const stack = this.stack;
          const b = stack.pop();
          const a = stack.pop();
          stack.pop().set(a, b);
        },
        setk: () => {
          const stack = this.stack;
          const b = stack.pop();
          const a = stack.pop();
          stack.last.set(a, b);
        },
        delete: () => {
          const stack = this.stack;
          const a = stack.pop();
          stack.pop().delete(a);
        },
        deletek: () => {
          const stack = this.stack;
          const a = stack.pop();
          stack.last.delete(a);
        },
        hasl: () => {
          const stack = this.stack;
          const b = stack.pop();
          const a = stack.pop();
          stack.push(this.getInt(a.hasl(b) ? 1n : 0n));
        },
        getl: () => {
          const stack = this.stack;
          const b = stack.pop();
          const a = stack.pop();
          stack.push(a.getl(b));
        },
        setl: () => {
          const stack = this.stack;
          const b = stack.pop();
          const a = stack.pop();
          stack.pop().setl(a, b);
        },
        setlk: () => {
          const stack = this.stack;
          const b = stack.pop();
          const a = stack.pop();
          stack.last.setl(a, b);
        },
        deletel: () => {
          const stack = this.stack;
          const a = stack.pop();
          stack.pop().deletel(a);
        },
        deletelk: () => {
          const stack = this.stack;
          const a = stack.pop();
          stack.last.deletel(a);
        },
        getProto: () => {
          const stack = this.stack;
          const a = stack.pop();
          stack.push(a.proto);
        },
        setProto: () => {
          const stack = this.stack;
          const b = stack.pop();
          const a = stack.pop();
          a.proto = b;
        },
        keys: () => {
          const stack = this.stack;
          const a = stack.pop();
          stack.push(this.createArr(a.kvMap.keys()));
        },
        assign: () => {
          const stack = this.stack;
          const b = stack.pop();
          const a = stack.pop();
          O.noimpl('assign');
        },
        replace: () => {
          const stack = this.stack;
          const b = stack.pop();
          const a = stack.pop();
          O.noimpl('replace');
        },
        obj: () => {
          const stack = this.stack;
          const a = stack.pop();
          stack.push(this.createRaw(a));
        },
        int: () => {
          const stack = this.stack;
          const a = stack.pop();
          stack.push(this.getInt(a.intVal));
        },
        char: () => {
          const stack = this.stack;
          const a = stack.pop();
          stack.push(this.getChar(a.intVal & 0xFFn));
        },
        arr: () => {
          const stack = this.stack;
          const len = stack.pop().intVal;
          if(len < 0n) return stack.push(getNative());

          const elems = [];

          for(let i = 0n; i !== len; i++)
            elems.push(stack.pop());

          stack.push(this.createArr(elems.reverse()));
        },
        str: () => {
          const stack = this.stack;
          const len = stack.pop().intVal;
          if(len < 0n) return stack.push(getNative());

          const elems = [];

          for(let i = 0n; i !== len; i++)
            elems.push(Number(stack.pop().intVal & 0xFFn));

          stack.push(new String(this, Buffer.from(elems.reverse())));
        },
        renew: () => {
          const stack = this.stack;
          const a = stack.pop();
          stack.push(this.createRaw(a.proto, a.kvMap));
        },
        null: () => {
          const stack = this.stack;
          stack.push(this.null);
        },
        root: () => {
          const stack = this.stack;
          stack.push(this.root);
        },
        mainStack: () => {
          const stack = this.stack;
          stack.push(this.mainStack);
        },
        frame: () => {
          const stack = this.stack;
          stack.push(this.frame);
        },
        func: () => {
          const stack = this.stack;
          stack.push(this.func);
        },
        scope: () => {
          const stack = this.stack;
          stack.push(this.scope);
        },
        this: () => {
          const stack = this.stack;
          stack.push(this.scope.get('this'));
        },
        getv: () => {
          const stack = this.stack;
          const a = stack.pop();
          stack.push(this.scope.get(a));
        },
        setv: () => {
          const stack = this.stack;
          const b = stack.pop();
          const a = stack.pop();
          this.scope.set(a, b);

          // log(a.name + ': ' + b.info);
        },
        getvl: () => {
          const stack = this.stack;
          const a = stack.pop();
          stack.push(this.scope.getl(a));
        },
        setvl: () => {
          const stack = this.stack;
          const b = stack.pop();
          const a = stack.pop();
          stack.push(this.scope.setl(a, b));
        },
        bind: () => {
          const stack = this.stack;
          stack.last.set('scope', this.scope);
        },
        ctx: () => {
          const stack = this.stack;
          stack.push(this.createRaw(this.scope));
        },
        jz: () => {
          const frame = this.frame;
          const stack = frame.get('stack');
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          if(a === 0n) frame.set('inst', this.getInt(b));
        },
        jnz: () => {
          const frame = this.frame;
          const stack = frame.get('stack');
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          if(a !== 0n) frame.set('inst', this.getInt(b));
        },
        jmp: () => {
          const frame = this.frame;
          const stack = frame.get('stack');
          const a = stack.pop().intVal;
          frame.set('inst', this.getInt(a));
        },
        alt: () => {
          const frame = this.frame;
          const stack = frame.get('stack');
          const c = stack.pop().intVal;
          const b = stack.pop().intVal;
          const a = stack.pop().intVal;
          frame.set('inst', this.getInt(a ? b : c));
        },
        call: () => {
          const stack = this.stack;
          const b = stack.pop();
          const a = stack.pop();
          a.call(b);
        },
        method: () => {
          const stack = this.stack;
          const c = stack.pop();
          const b = stack.pop();
          const a = stack.pop();
          b.set('this', c);
          a.call(b);
        },
        new: () => {
          const stack = this.stack;
          const b = stack.pop();
          const a = stack.pop();
          b.set('this', this.createRaw(a.get('prototype')));
          a.call(b);
        },
        ret: () => {
          const a = this.stack.last;
          mainStack.pop();
          this.stack.push(a);
        },
        retv: () => {
          mainStack.pop();
        },
        in: () => {
          const stack = this.stack;
          stack.push(this.input);
        },
        out: () => {
          const stack = this.stack;
          const val = stack.last;
          const len = val.get('length').intVal;

          if(len >= 0n){
            const out = [];

            for(let i = 0n; i !== len; i++)
              out.push(Number(val.get(this.getInt(i)).intVal & 0xFFn));

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

    this.gcEnabled = 1;
  }

  run(input){
    const {entry, objs} = this;
    const {insts} = objs;

    this.entry = null;
    entry.call(this.createRaw(objs.root));

    objs.input = new String(this, input);

    while(this.output === null){
      const {frame} = this;

      if(0){
        log(`\n${'='.repeat(100)}\n`);
        
        const stack = frame.get('stack');
        const len = stack.get('length').intVal;
        log('\n---')
        log('LENGTH: ' + len);
        log('HAS 0: ' + stack.hasl(this.getInt(BigInt(0))));
        if(len) log('KEY 0: ' + stack.getl(this.getInt(BigInt(0))).info);
        log([...stack.kvMap.keys()].map(a => a.info).join`\n`)
        log('---\n')
        const str = O.ca(Number(len), i => stack.get(this.getInt(BigInt(i))).info).join('\n') || '/';

        log('Stack:');
        log.inc();
        log(str);
        log.dec();
        log();
      }

      const func = frame.get('func');
      const instPtr = frame.get('inst').intVal;
      const finsts = func.get('insts');

      if(instPtr >= finsts.get('length').intVal){
        // debug('IMPLICIT RETURN');
        this.mainStack.pop();
        continue;
      }

      const inst = finsts.get(this.getInt(instPtr));
      frame.set('inst', this.getInt(instPtr + 1n));

      const instf = insts.get(inst);

      if(!instf){
        // debug(`CUSTOM ${inst.info || '/'}`);
        frame.get('stack').push(inst);
        continue;
      }

      // debug(inst.name);
      instf();
    }

    return this.output;
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

  createStackFrame(func, scope){
    const frame = this.createObj([
      ['func', func],
      ['inst', this.zero],
      ['scope', scope],
      ['stack', this.createArr()],
    ]);

    return frame;
  }
}

class Object{
  static kNull = global.Symbol('null');

  #proto = null;

  info = null;

  kvMap = new Map();
  keys = new Set();

  constructor(prog, proto=null, kvPairs=null){
    this.prog = prog;

    this.#proto = (
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

  get intVal(){ /*return 0n;*/ assert.fail('intVal'); }

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
    return this.get(this.prog.getInt(this.get('length').intVal - 1n));
  }

  set last(val){
    this.set(this.prog.getInt(this.get('length').intVal - 1n), val);
  }

  push(val){
    const {prog} = this;

    const len = this.get('length');
    const lenNew = prog.getInt(len.intVal + 1n);

    this.set(len, val);
    this.set('length', lenNew);
  }

  pop(){
    assert.strictEqual(Number(this.get('length').intVal) + 1, this.kvMap.size);
    assert.strictEqual(this.kvMap.size, this.keys.size);

    const {prog} = this;
    
    const len = this.get('length');
    const lenNew = prog.getInt(len.intVal - 1n);

    this.set('length', lenNew);

    const elem = this.get(lenNew);
    this.delete(lenNew);

    assert.strictEqual(Number(this.get('length').intVal) + 1, this.kvMap.size);
    assert.strictEqual(this.kvMap.size, this.keys.size);

    return elem;
  }

  has(key){
    const {prog} = this;
    const n = prog.null;

    if(typeof key === 'string')
      key = prog.getSym(key);

    for(let obj = this; obj !== n; obj = obj.#proto)
      if(obj.hasl(key))
        return 1;

    return 0;
  }

  get(key){
    const {prog} = this;
    const n = prog.null;

    if(typeof key === 'string')
      key = prog.getSym(key);

    for(let obj = this; obj !== n; obj = obj.#proto)
      if(obj.hasl(key))
        return obj.getl(key);

    return /*n*/ assert.fail('get');
  }

  set(key, val){
    const {prog} = this;
    const n = prog.null;

    if(typeof key === 'string')
      key = prog.getSym(key);

    for(let obj = this; obj !== n; obj = obj.#proto)
      if(obj.hasl(key))
        return obj.setl(key, val);

    this.setl(key, val);
  }

  delete(key){
    const {prog} = this;
    const n = prog.null;

    if(typeof key === 'string')
      key = prog.getSym(key);

    for(let obj = this; obj !== n; obj = obj.#proto)
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

    if(!this.kvMap.get(key)){
      assert(!this.kvMap.has(key));

      log(this.get('length') === prog.getInt(4n));
      log(this.info);
      log(this.get('length').intVal.toString());
      log(key.info);
    }

    return this.kvMap.get(key) || /*this.prog.null*/assert.fail('getl');
  }

  setl(key, val){
    const {prog, kvMap, keys} = this;

    if(typeof key === 'string')
      key = prog.getSym(key);

    assert(val);
    kvMap.set(key, val);

    if(keys.has(key))
      keys.delete(key);
    
    keys.add(key);
  }

  deletel(key){
    const {prog, kvMap, keys} = this;

    if(typeof key === 'string')
      key = prog.getSym(key);

    if(!kvMap.has(key)){
      assert.fail('deletel');
      return;
    }

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

  get intVal(){ return BigInt(this.code); }
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
  constructor(prog, buf=null){
    super(prog, prog.getProto('str')).setInfo(`str ${O.sf(buf.toString())}`);

    this.setl('length', prog.zero);

    if(buf !== null)
      for(const byte of buf)
        this.push(prog.getChar(byte));
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