'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../../..');

const THROW_ON_WARNING = 0;

const spacingTypes = [
  ' ',
  '\n',
  '\n\n',
];

class Parser{
  static parse(src){
    return new Parser(src).parse();
  }

  constructor(src){
    this.file = 'program';
    this.str = String(src);
    this.strLen = this.str.length;
    this.index = 0;

    this.cLine = 1;
    this.cPos = 1;
    this.tLine = 1;
    this.tPos = 1;
    this.cLinePrev = 1;
    this.cPosPrev = 1;
    this.tLinePrev = 1;
    this.tPosPrev = 1;

    this.eof = 0;
  }

  parse(){
    assert(this.index === 0 && !this.eof);

    const topList = this.createTopList();
    const stack = [];

    const push = elem => {
      if(stack.length === 0){
        topList.push(elem);
        return;
      }

      O.last(stack).push(elem);
    };

    for(const tk of this.getAllTokens()){
      if(tk === '('){
        const elem = this.createList();
        stack.push(elem);

        continue;
      }

      if(tk === ')'){
        if(stack.length === 0)
          this.err(`Unmatched closed parenthese`);

        const elem = stack.pop();
        elem.endLine = this.cLinePrev;
        elem.endPos = this.cPosPrev;
        push(elem);

        continue;
      }

      push(this.createIdent(tk));
    }

    if(stack.length !== 0)
      stack[0].err(`Unmatched open parenthese`);

    return topList;
  }

  createList(){
    return new List(null, this, this.cLinePrev, this.cPosPrev);
  }

  createTopList(){
    return new TopList(null, this);
  }

  createIdent(name){
    const elem = new Identifier(name, this, this.tLinePrev, this.tPosPrev);

    elem.endLine = this.cLinePrev;
    elem.endPos = this.cPosPrev;

    return elem;
  }

  nextChar(adv=1){
    assert(!this.eof);

    if(this.index === this.strLen)
      return null;

    const c = this.str[this.index];

    if(!/[\t\r\n -~]/.test(c))
      this.err('Illegal character', this.cLine, this.cPos);

    if(adv){
      this.index++;
      this.cLinePrev = this.cLine;
      this.cPosPrev = this.cPos;

      if(c === '\n'){
        this.cLine++;
        this.cPos = 1;
      }else{
        this.cPos++;
      }
    }

    return c;
  }

  nextToken(){
    assert(!this.eof);

    while(1){
      const c = this.nextChar(0);

      if(c === null){
        this.eof = 1;
        return null;
      }

      if(/\S/.test(c)) break;

      this.nextChar(1);
    }

    this.tLinePrev = this.cLine;
    this.tPosPrev = this.cPos;

    const c = this.nextChar(1);
    assert(c !== null);

    const isIdent = /(?![\(\)])[!-~]/.test(c);
    let ident = c;

    if(isIdent){
      while(1){
        const c = this.nextChar(0);

        if(c === null) break;
        if(!/(?![\(\)])[!-~]/.test(c)) break;

        ident += c;

        this.nextChar(1);
      }
    }

    this.tLine = this.cLine;
    this.tPos = this.cPos;

    if(isIdent) return ident;

    assert(/[\(\)]/.test(c));
    return c;
  }

  *getAllTokens(){
    while(1){
      const tk = this.nextToken();
      if(tk === null) return;
      yield tk;
    }
  }

  warn(msg, line=this.cLinePrev , pos=this.cPosPrev){
    assert(typeof line === 'number');
    assert(typeof pos === 'number');

    this.sWarn(msg, this.file, O.sanl(this.str)[line - 1], line, pos);
  }

  warnc(msg){ this.warn(msg, this.cLinePrev, this.cPosPrev); }
  warnt(msg){ this.warn(msg, this.tLinePrev, this.tPosPrev); }

  err(msg, line=this.cLinePrev , pos=this.cPosPrev){
    assert(typeof line === 'number');
    assert(typeof pos === 'number');

    this.sErr(msg, this.file, O.sanl(this.str)[line - 1], line, pos);
  }

  errc(msg){ this.err(msg, this.cLinePrev, this.cPosPrev); }
  errt(msg){ this.err(msg, this.tLinePrev, this.tPosPrev); }

  sWarn(msg, file, str, line, pos){
    if(!THROW_ON_WARNING){
      log.inc();
      log(msg);
      log.dec();

      return;
    }

    this.sErr(msg, file, str, line, pos);
  }

  warn(msg){
    log(msg);
    if(!THROW_ON_WARNING) return;

    this.exit();
  }

  sErr(msg, str, line, pos){
    assert(typeof msg === 'string');

    let s = `${
      this.file}:${
      line}\n\n${
      str}\n${
      `${' '.repeat(pos - 1)}^`}\n\nError: ${
      msg}`;

    if(esolangs.debugMode)
      s += `\n${O.sanl(new Error().stack).slice(1).join('\n')}`;

    O.exit(s);
  }

  err(msg){
    O.exit(msg);
  }
}

class ListElement extends O.Stringifiable{
  static from(e, top){
    const s = a => typeof a === 'string';

    const from = function*(e, top=0){
      if(s(e)) return new Identifier(e);

      const list = top ? new TopList() : new List();

      for(const arg of e){
        if(typeof arg === 'number'){
          list.setsp(arg, list.n);
          continue;
        }

        list.push(yield [from, arg]);
      }

      return list;
    };

    return O.rec(from, e, top);
  }

  endLine = null;
  endPos = null;

  constructor(parser=null, startLine=null, startPos=null){
    super();

    this.parser = parser;
    this.startLine = startLine;
    this.startPos = startPos;
  }

  get s(){ return 0; }
  get v(){ return 0; }

  ident(){ O.virtual('ident'); }
  list(){ O.virtual('list'); }

  get m(){
    return this.ident().name;
  }

  get isNat(){
    return /^(?:0|[1-9][0-9]*)$/.test(this.m);
  }

  get isInt(){
    return /^(?:0|\-?[1-9][0-9]*)$/.test(this.m);
  }

  get nat(){
    if(!this.isNat)
      this.err(`Expected a natural number, but found ${O.sf(this.m)}`);

    return BigInt(this.m);
  }

  get int(){
    if(!this.isInt)
      this.err(`Expected an integer, but found ${O.sf(this.m)}`);

    return BigInt(this.m);
  }

  lenp(start){ return this.len(start, null); }
  lenm(end){ return this.len(null, end); }

  e(i){
    assert(!isNaN(i));
    this.lenp(i + 1);
    return this.elems[i];
  }

  a(i=0, func=null){
    if(func === null && typeof i === 'function'){
      func = i;
      i = 0;
    }

    let arr = this.lenp(i).elems.slice(i);
    if(func !== null) arr = arr.map(func);
    return arr;
  }

  ta(type, func=null){
    let arr = this.type(type).a(1);
    if(func !== null) arr = arr.map(func);
    return arr;
  }

  empty(){
    return this.n === 0;
  }

  type(type){
    this.fst.ident(type);
    return this;
  }

  get fst(){
    return this.e(0);
  }

  get snd(){
    return this.e(1);
  }

  get last(){
    return this.e(this.n - 1);
  }

  get uni(){
    return this.len(1).fst;
  }

  get n(){
    return this.elems.length;
  }
  
  warn(msg, line=this.startLine, pos=this.startPos){
    this.parser.warn(msg, line, pos);
  }

  warnStart(msg){ this.warn(msg, this.startLine, this.startPos); }
  warnEnd(msg){ this.warn(msg, this.endLine, this.endPos); }

  err(msg, line=this.startLine, pos=this.startPos){
    this.parser.sErr(msg, line, pos);
  }

  errStart(msg){ this.err(msg, this.startLine, this.startPos); }
  errEnd(msg){ this.err(msg, this.endLine, this.endPos); }
}

class Identifier extends ListElement{
  constructor(name=null, parser, startLine, startPos){
    super(parser, startLine, startPos);
    this.name = name;
  }

  get s(){ return 1; }

  ident(name=null){
    if(name !== null && name !== this.name)
      this.err(`Expected identifier ${O.sf(name)}, but found ${O.sf(this.name)}`);

    return this;
  }

  list(){
    this.err(`Expected a list, but found identifier ${O.sf(this.name)}`);
  }

  len(){
    this.list();
  }

  get chNum(){ return 0; }

  toStr(){
    return this.name;
  }
}

class List extends ListElement{
  spacingType = 0;
  spacingStart = 1;

  constructor(elems=null, parser, startLine, startPos){
    super(parser, startLine, startPos);

    if(elems === null) elems = [];
    this.elems = elems;
  }

  push(elem){
    this.elems.push(elem);
  }

  get v(){ return 1; }
  get isTop(){ return 0; }

  ident(){
    this.err(`Expected an identifier, but found a list`);
  }

  list(){ return this; }

  len(start=null, end=start){
    const {elems} = this;
    const n = elems.length;

    if(start !== null){
      if(n < Number(start))
        this.errEnd(`Expected an element, but found the end of the list`);

      if(end !== null && n > Number(end))
        elems[start].err(`Superfluous element found in the list`);
    }

    return this;
  }

  get chNum(){ return this.elems.length; }
  getCh(i){ return this.elems[i]; }

  setsp(spacingType=0, spacingStart=1){
    this.spacingType = spacingType;
    this.spacingStart = spacingStart;
  }

  toStr(){
    const {elems, spacingType, spacingStart} = this;
    const arr = ['('];

    elems.forEach((e, i) => {
      if(spacingType !== 0 && i === spacingStart)
        arr.push(this.inc);

      const spType = i >= spacingStart ? spacingType : 0;
      if(spType !== 0 || i !== 0) arr.push(spacingTypes[spType]);

      arr.push(e);
    });

    if(spacingType !== 0 && elems.length > spacingStart)
      arr.push(this.dec, '\n');

    arr.push(')');

    return arr;
  }
}

class TopList extends List{
  get isTop(){ return 1; }

  ident(){ assert.fail(); }
  errStart(){ assert.fail(); }

  errEnd(msg=null){
    const {elems} = this;
    const n = elems.length;

    if(n === 0)
      this.err(msg !== null ? `Unexpected end of the source code` : msg, 1, 1);

    O.last(elems).errEnd(msg !== null ? msg : `Superfluous element found in the list`);
  }
}

module.exports = Object.assign(Parser, {
  spacingTypes,

  ListElement,
  Identifier,
  List,
  TopList,
});