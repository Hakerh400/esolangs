'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

class Base extends O.Stringifiable{}

class System extends Base{
  constructor(rules){
    super();
    this.rules = rules;
  }

  toStr(){
    return this.join([], this.rules, '\n');
  }
}

class Rule extends Base{
  constructor(lhs, rhs){
    super();
    this.lhs = lhs;
    this.rhs = rhs;
  }

  toStr(){
    return [this.lhs, ' - ', this.rhs, ';'];
  }
}

class Lhs extends Base{
  constructor(str='', end=0){
    super();
    this.str = new String(str);
    this.end = end;
  }

  add(str){
    this.str.add(str);
  }

  toStr(){
    return [this.str, this.end ? '#' : ''];
  }
}

class Rhs extends Base{
  constructor(elems=[]){
    super();
    this.elems = elems;
  }

  add(elem){
    this.elems.push(elem);
  }

  toStr(){
    return this.join([], this.elems, '');
  }
}

class Element extends Base{}

class String extends Element{
  constructor(str=''){
    super();
    this.str = str;
  }

  add(str){
    this.str += str;
  }

  toStr(){
    return this.str.replace(/[\\\#\-\.\(\)]/g, a => `\\${a}`);
  }
}

class Match extends Element{
  static instance = null;

  constructor(){
    super();

    if(Match.instance === null)
      Match.instance = this;

    return Match.instance;
  }

  toStr(){
    return '.';
  }
}

class Group extends Element{
  constructor(elems=[]){
    super();
    this.elems = elems;
  }

  get last(){ return O.last(this.elems); }

  add(elem){
    this.elems.push(elem);
  }

  toStr(){
    const arr = ['('];
    this.join(arr, this.elems, '');
    arr.push(')');
    return arr;
  }
}

module.exports = {
  Base,
  System,
  Rule,
  Lhs,
  Rhs,
  Element,
  String,
  Match,
  Group,
};