'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

class Tokenizer{
  emittedEof = 0;

  constructor(src){
    this.src = src.toString('binary').replace(/\s+/g, '');
    this.srcPrev = this.src;
  }

  next(){
    assert(!this.emittedEof);

    const {src} = this;
    
    this.srcPrev = src;

    if(src.length === 0)
      return this.emitEof();

    if(src[0] === '.'){
      this.src = src.slice(1);
      return new Dot();
    }

    if(src[0] === '+'){
      this.src = src.slice(1);
      return new Plus();
    }

    if(src[0] === '%'){
      this.src = src.slice(1);
      return new Percent();
    }

    if(src[0] === '~'){
      this.src = src.slice(1);
      return new Tilde();
    }

    if(src[0] === '-'){
      this.src = src.slice(1);
      return new Minus();
    }

    if(src[0] === '*'){
      this.src = src.slice(1);
      return new Star();
    }

    if(src[0] === '|'){
      this.src = src.slice(1);
      return new Pipe();
    }

    if(/[0-9]/.test(src[0])){
      const str = src.match(/^[0-9]+/)[0];
      this.src = src.slice(str.length);
      return new Number(str);
    }

    if(/[a-zA-Z]/.test(src[0])){
      const str = src.match(/^[a-zA-Z][a-zA-Z0-9]*/)[0];
      this.src = src.slice(str.length);
      return new Identifier(str);
    }

    esolangs.err(`Invalid token: ${O.sf(src[0])}`);
  }

  emitEof(){
    this.emittedEof = 1;
    return new Eof();
  }
}

class Token{}
class Eof extends Token{}
class Dot extends Token{}
class Plus extends Token{}
class Percent extends Token{}
class Tilde extends Token{}
class Minus extends Token{}
class Star extends Token{}
class Pipe extends Token{}

class Number extends Token{
  constructor(str){
    super();

    const num = +str;

    if(num > Number.MAX_SAFE_INTEGER)
      esolangs.err(`Too large number: ${str}`);

    this.val = num;
  }
}

class Identifier extends Token{
  constructor(str){
    super();

    this.name = str;
  }
}

module.exports = {
  Tokenizer,
  Token,
  Eof,
  Dot,
  Plus,
  Percent,
  Tilde,
  Minus,
  Star,
  Pipe,
  Number,
  Identifier,
};