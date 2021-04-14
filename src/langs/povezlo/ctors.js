'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');

class Base extends O.Stringifiable{}

class Function extends Base{
  static *parse(bits){
    const next = function*(){
      const bit = yield [[bits, 'getBit']];
      bits = yield [[bits, 'getNext']];

      return bit;
    };

    const isNext = function*(bit){
      return (yield [next]) === bit;
    };

    const parse = function*(){
      if(yield [isNext, 0])
        return Argument.arg;

      if(yield [isNext, 0])
        return new Bit(yield [next], yield [parse]);

      return new Call(yield [parse], yield [parse]);
    };

    const target = yield [parse];
    const arg = yield [parse];
    const func = new Function(target, arg);

    // log(func.toString());
    // O.logb();
    // debug();

    return func;
  }

  constructor(case0, case1){
    super();
    this.case0 = case0;
    this.case1 = case1;
  }

  toStr(){
    return [
      'Function', this.inc, '\n',
      'case 0: ', this.case0, '\n',
      'case 1: ', this.case1,
      this.dec,
    ];
  }
}

class Expression extends Base{}

class Argument extends Expression{
  static #kCtor = Symbol('ctor');
  static #arg = null;

  static get arg(){
    if(this.#arg === null)
      this.#arg = new this(this.#kCtor);

    return this.#arg;
  }

  constructor(kCtor){
    assert(kCtor === Argument.#kCtor);
    super();
  }

  toStr(){
    return '.';
  }
}

class Bit extends Expression{
  constructor(bit, next){
    super();
    this.bit = bit;
    this.next = next;
  }

  toStr(){
    return [String(this.bit), ' ', this.next];
  }
}

class Call extends Expression{
  constructor(target, arg){
    super();
    this.target = target;
    this.arg = arg;
  }

  toStr(){
    return [
      '*', this.inc, '\n',
      'tgt: ', this.target, '\n',
      'arg: ', this.arg,
      this.dec,
    ];
  }
}

module.exports = {
  Base,
  Function,
  Expression,
  Argument,
  Bit,
  Call,
};