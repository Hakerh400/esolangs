'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const SG = require('../serializable-graph');
const Element = require('./element');
const cgs = require('./common-graph-nodes');

const sstr = (node, func=null) => {
  const isStr = typeof node === 'string';
  const str = isStr ? node : node.sstr;

  if(func === null) return str;
  return func(str, !isStr);
};

class AST extends SG.Node{
  static ptrsNum = this.keys(['syntax', 'str', 'node']);

  constructor(graph, syntax=null, str=null, node=null){
    super(graph);
    if(graph.dsr) return;

    this.syntax = syntax;
    this.str = str;
    this.node = node;
  }
}

class ASTNode extends SG.Node{
  static ptrsNum = this.keys(['ast', 'ref']);

  lookahead = 0;

  constructor(graph, ast=null, index=0, ref=null){
    super(graph);
    if(graph.dsr) return;

    this.ast = ast;
    this.ref = ref;
    this.index = index
    this.len = -1;
    this.done = 0;
  }

  ser(s){
    super.ser(s);
    s.writeUint(this.index);
    s.writeInt(this.len);
    s.write(this.done);
  }

  deser(s){
    super.deser(s);
    this.index = s.readUint();
    this.len = s.readInt();
    this.done = s.read();
  }

  get end(){ return this.index + this.len; }
  get str(){ return this.toString(); }
  get jst(){ return this.arr.length !== 0 ? this.arr[0] : []; }

  get am(){
    const {arr} = this;
    if(arr.length === 0) return arr;
    return arr[0];
  }

  sstr(func){ return [...this].map(a => sstr(a, func)).join(''); }

  reset(){ O.virtual('reset'); }
  update(){ O.virtual('update'); }

  setLookahead(){
    this.lookahead = 1;
    this.len = 0;
    this.done = 1;
  }

  err(msg){
    const {g} = this;
    g.th.throw(new cgs.SyntaxError(g, msg));
  }

  finalize(){
    this.done = 1;
    return this;
  }

  *[Symbol.iterator](){ O.virtual('Symbol.iterator'); }

  toString(){
    return this.ast.str.slice(this.index, this.end);
  }
}

class ASTDef extends ASTNode{
  static ptrsNum = this.keys(['pats', 'pat', 'elems']);

  get es(){ return this.elems; }
  set es(a){ this.elems = a; }

  constructor(graph, ast, index, ref){
    super(graph, ast, index, ref);
    if(graph.dsr) return;

    this.pats = [];
    this.pat = null;
    this.elems = null;
    this.patIndex = 0;
  }

  ser(s){ super.ser(s); s.writeUint(this.index).writeInt(this.len).write(this.done); }
  deser(s){
    super.deser(s);
    this.index = s.readUint();
    this.len = s.readInt();
    this.done = s.read();
  }

  get fst(){ return this.elems[0]; }
  get pti(){ return this.patIndex; }

  reset(){
    this.pats.length = 0;
    this.pat = null;
    this.patIndex = 0;

    return this;
  }

  update(){
    const {pats} = this;

    let len = -1;
    let patIndex = 0;
    let done = 1;

    for(let i = 0; i !== pats.length; i++){
      const pat = pats[i];
      if(!pat.done) done = 0;
      if(pat.len <= len) continue;

      len = pat.len;
      patIndex = i;
    }

    this.len = len;
    this.patIndex = patIndex;
    this.done = done;

    this.pat = this.pats[patIndex];
    this.pats = null;
    this.elems = this.pat.elems;

    return this;
  }

  *[Symbol.iterator](){
    for(const elem of this.elems)
      yield* elem.arr;
  }
}

class ASTPat extends ASTNode{
  static ptrsNum = this.keys(['elems', 'indices', 'lens']);

  get es(){ return this.elems; }
  set es(a){ this.elems = a; }

  constructor(graph, ast, index, ref){
    super(graph, ast, index, ref);
    if(graph.dsr) return;

    this.elems = [];
    this.indices = [];
    this.lens = [];
  }

  get fst(){ return this.elems[0]; }

  reset(){
    this.elems.length = 0;
    this.indices.length = 0;
    this.lens.length = 0;

    return this;
  }

  update(){
    const {elems} = this;

    let len = 0;
    let done = 1;

    for(let i = 0; i !== elems.length; i++){
      const elem = elems[i];
      if(!elem.done) done = 0;
      assert(elem.len !== -1);

      len += elem.len;
    }

    this.len = len;
    this.done = done;

    return this;
  }

  *[Symbol.iterator](){
    for(const elem of this.elems)
      yield* elem.arr;
  }
}

class ASTElem extends ASTNode{
  static ptrsNum = this.keys(['arr', 'seps']);

  constructor(graph, ast, index, ref){
    super(graph, ast, index, ref);
    if(graph.dsr) return;

    this.arr = [];
    this.seps = [];
  }

  get fst(){ return this.arr[0]; }

  getLen(){ O.virtual('getLen'); }

  reset(){
    this.arr.length = 0;
    this.seps.length = 0;

    return this;
  }

  *[Symbol.iterator](){
    const {arr, seps} = this;

    for(let i = 0; i !== arr.length; i++){
      yield arr[i];
      if(i < seps.length) yield seps[i];
    };
  }
}

class ASTNterm extends ASTElem{
  constructor(graph, ast, index, ref){
    super(graph, ast, index, ref);
    if(graph.dsr) return;
  }

  getLen(){ return this.arr.length; }

  update(){
    const {arr, seps} = this;
    const fDone = e => e.done;

    if(arr.length !== 0 && arr.length === seps.length)
      seps.pop();

    this.len = arr.reduce((n, e) => n + e.len, 0) + seps.reduce((n, e) => n + e.len, 0);
    this.done = arr.every(fDone) && seps.every(fDone);

    return this;
  }
}

class ASTTerm extends ASTElem{
  constructor(graph, ast, index, ref){
    super(graph, ast, index, ref);
    if(graph.dsr) return;
  }

  getLen(){
    const {arr} = this;
    if(arr.length === 0) return 0;
    return arr[0].length;
  }

  update(){
    const {arr, seps} = this;

    if(arr.length !== 0 && arr.length === seps.length)
      seps.pop();

    this.len = arr.reduce((n, s) => n + s.length, 0) + seps.reduce((n, e) => n + e.len, 0);
    this.done = 1;

    return this;
  }
}

module.exports = Object.assign(AST, {
  ASTNode,
  ASTDef,
  ASTPat,
  ASTElem,
  ASTNterm,
  ASTTerm,
});