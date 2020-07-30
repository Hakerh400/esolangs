'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

class Base extends O.Stringifiable{}

class Program extends Base{
  constructor(elems){
    super();

    this.elems = elems;
  }

  toStr(){
    return this.join([], this.elems, '');
  }
}

class Element extends Base{}

class Instruction extends Element{
  constructor(type, args){
    super();

    const len = args.length;
    const [a, b, c] = args;

    switch(type){
      case 0:
        if(len === 0) args = [0, 1, 0];
        else if(len === 1) args = [a, 1, a];
        else if(len === 2) args = [a, 1, b];
        break;

      case 1:
        if(len === 0) args = [0, 1];
        else if(len === 1) args = [a, 1];
        break;

      case 2:
        if(len === 0) args = [0, 1, 1];
        else if(len === 1) args = [a, 1, 0];
        else if(len === 2) args = [a, 1, b];
        break;

      case 3:
        if(len === 0) args = [0, 1];
        else if(len === 1) args = [a, 1];
        break;

      case 4:
        if(len === 0) args = [0];
        break;

      case 5:
        if(len === 0) args = [0];
        break;

      default:
        assert.fail(type);
        break;
    }

    this.type = type;
    this.args = args;
  }

  toStr(){
    return `${'+-~*.%'[this.type]}${this.args.join('|')}`;
  }
}

class List extends Element{
  static empty = new List();

  constructor(elems=[]){
    super();

    this.elems = elems;
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
  Program,
  Element,
  Instruction,
  List,
};