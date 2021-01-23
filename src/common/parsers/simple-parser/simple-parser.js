'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../../..');

const {min, max} = Math;

class SimpleParser{
  constructor(str){
    assert(typeof str === 'string');
    this.str = str;
  }

  get structName(){ return 'source code'; }

  checkBounds(n, min, max){
    if(min !== null && n < min)
      this.err(`Expected a number that is less than or equal to ${
        min}, but found ${n}`);

    if(max !== null && n > max)
      this.err(`Expected a number that is greater than or equal to ${
        max}, but found ${n}`);

    return n;
  }

  char(opts={}){
    const {
      force = 0,
      update = 0,
    } = opts;

    if(force) this.assertNeof();
    if(this.eof) return null;

    const char = this.str[0];
    if(update) this.match(char);

    return char;
  }

  match(pat, opts={}){
    const {
      force = 1,
      update = 1,
      trim = /^\s*/,
    } = opts;

    let match = null;

    getMatch: {
      if(typeof pat === 'string'){
        if(!this.str.startsWith(pat)) break getMatch;
        match = [pat];
        break getMatch;
      }

      if(pat instanceof RegExp){
        match = this.str.match(pat);
        break getMatch;
      }

      assert.fail(pat);
    }

    const ok = match !== null;

    if(!ok && force)
      this.err(`Unable to match pattern ${typeof pat === 'string' ? O.sf(pat) : pat}`);

    if(ok && update){
      this.str = this.str.slice(match[0].length);
      if(trim !== null) this.str = this.str.replace(trim, '');
    }

    return ok ? match.length !== 1 ? match.slice(1) : match[0] : null;
  }

  matchOpenParen(){ return this.match('('); }
  matchClosedParen(){ return this.match(')'); }
  matchComma(){ return this.match(','); }

  *parseInt(min, max){
    const n = +this.match(/^[+\-]?\d+/);
    return this.checkBounds(n, min, max);
  }

  *parseDecimal(min, max){
    const n = +this.match(/^[+\-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+\-]?\d+)?/);
    return this.checkBounds(n, min, max);
  }

  *parsePercent(){
    const n = yield [[this, 'parseInt'], 0, 100];
    this.match('%');

    return n / 100;
  }

  *parseIdent(opts={}){
    const {
      dash = 0,
      underscore = 1,
    } = opts;

    const reg = new RegExp(`^[a-zA-Z0-9${
      dash ? '\\-' : ''}${
      underscore ? '\x5F' : ''}]+`)

    return this.match(reg);
  }

  get eof(){ return this.str.length === 0; }
  get neof(){ return this.str.length !== 0; }

  assertEof(){
    if(this.eof) return this;
    this.err(`Extra data found at the end of the ${this.structName}`);
  }

  assertNeof(){
    if(this.neof) return this;
    this.err(`Unexpected end of the ${this.structName}`);
  }

  err(msg=null){
    const msgStr = msg !== null ? `: ${msg}` : '';

    const near = this.str.trim() ?
      `\n\nNear: ${this.str.slice(0, 100)}` :
      `Near the end of the ${this.structName}`;

    esolangs.err(`Syntax error${msgStr}${near}`);
  }
}

module.exports = SimpleParser;