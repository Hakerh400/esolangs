'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

class Base extends O.Stringifiable{}

class Program extends Base{
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
    const arr = [];

    arr.push(this.lhs);

    if(this.rhs !== null) arr.push('.', this.rhs);
    else arr.push('~');

    return arr;
  }
}

class Lhs extends Base{
  constructor(left, right){
    super();

    this.left = left[0];
    this.right = right[0];
    this.start = left[1];
    this.end = right[1];

    {
      let regStr = '';

      if(this.start) regStr += '^';
      regStr += `${this.left}\\.${this.right}`;
      if(this.end) regStr += '$';

      this.reg = new RegExp(regStr);
    }
  }

  toStr(){
    const arr = [];

    if(this.start) arr.push('#');
    arr.push(this.left, '.', this.right);
    if(this.end) arr.push('#');

    return arr;
  }
}

class Rhs extends Base{
  constructor(left, right){
    super();

    this.left = left;
    this.right = right;

    this.str = `${this.left}.${this.right}`;
  }

  toStr(){
    return this.str;
  }
}

module.exports = {
  Base,
  Program,
  Rule,
  Lhs,
  Rhs,
};