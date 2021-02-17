'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const gcd = require('../gcd');

class Rational{
  static ZERO = new Rational(0n);
  static ONE = new Rational(1n);

  #a = 0n;
  #b = 1n;

  constructor(a=0n, b=1n){
    this.#a = a;
    this.#b = b;
    this.simplify();
  }

  slice(){
    return new Rational(this.#a, this.#b);
  }

  get a(){ return this.#a; }
  get b(){ return this.#b; }

  get isInt(){ return this.#b === 1n; }
  get isZero(){ return this.#a === 0n; }
  get isPos(){ return this.#a > 0n; }
  get isNeg(){ return this.#a < 0n; }
  get isNpos(){ return this.#a <= 0n; }
  get isNneg(){ return this.#a >= 0n; }

  neg(){
    const a = this.#a, b = this.#b;

    this.#a = -a;

    return this.simplify();
  }

  floor(){
    const a = this.#a, b = this.#b;

    if(b !== 1n){
      this.#a = a / b * b;
      if(a < 0n) this.#a -= b;
    }

    return this.simplify();
  }

  ceil(){
    const a = this.#a, b = this.#b;

    if(b !== 1n){
      this.#a = (a / b + 1n) * b;
      if(a < 0n) this.#a -= b;
    }

    return this.simplify();
  }

  round(){
    const aa = this.#a, bb = this.#b;

    this.#a = (aa << 1n) + bb;
    this.#b = bb << 1n;
    this.simplify();

    const a = this.#a, b = this.#b;

    if(b !== 1n){
      this.#a = a / b * b;
      if(a < 0n) this.#a -= b;
    }

    return this.simplify();
  }

  frac(){
    const a = this.#a, b = this.#b;

    this.#a = a - a / b * b;
    if(b !== 1n && a < 0n) this.#a += b;

    return this.simplify();
  }

  eq(r){
    assert(r instanceof Rational);

    const a = this.#a, b = this.#b;
    const c = r.#a, d = r.#b;

    return a * d === b * c;
  }

  neq(r){
    assert(r instanceof Rational);

    const a = this.#a, b = this.#b;
    const c = r.#a, d = r.#b;

    return a * d !== b * c;
  }

  lt(r){
    assert(r instanceof Rational);

    const a = this.#a, b = this.#b;
    const c = r.#a, d = r.#b;

    return a * d < b * c;
  }

  gt(r){
    assert(r instanceof Rational);

    const a = this.#a, b = this.#b;
    const c = r.#a, d = r.#b;

    return a * d > b * c;
  }

  lte(r){
    assert(r instanceof Rational);

    const a = this.#a, b = this.#b;
    const c = r.#a, d = r.#b;

    return a * d <= b * c;
  }

  gte(r){
    assert(r instanceof Rational);

    const a = this.#a, b = this.#b;
    const c = r.#a, d = r.#b;

    return a * d >= b * c;
  }

  set(r){
    assert(r instanceof Rational);

    this.#a = r.#a;
    this.#b = r.#b;

    return this.simplify();
  }

  add(r){
    assert(r instanceof Rational);

    const a = this.#a, b = this.#b;
    const c = r.#a, d = r.#b;

    this.#a = a * d + b * c;
    this.#b = b * d;

    return this.simplify();
  }

  sub(r){
    assert(r instanceof Rational);

    const a = this.#a, b = this.#b;
    const c = r.#a, d = r.#b;

    this.#a = a * d - b * c;
    this.#b = b * d;

    return this.simplify();
  }

  mul(r){
    assert(r instanceof Rational);

    const a = this.#a, b = this.#b;
    const c = r.#a, d = r.#b;

    this.#a = a * c;
    this.#b = b * d;

    return this.simplify();
  }

  div(r){
    assert(r instanceof Rational);

    const a = this.#a, b = this.#b;
    const c = r.#a, d = r.#b;
    assert(c !== 0n);

    this.#a = a * d;
    this.#b = b * c;

    return this.simplify();
  }

  simplify(){
    const a = this.#a;
    const b = this.#b;

    assert(typeof a === 'bigint');
    assert(typeof b === 'bigint');
    assert(b !== 0n);

    const pos = (a > 0n) === (b > 0n);

    let aNew = a;
    let bNew = b;

    if(a !== 0n){
      const aa = a > 0n ? a : -a;
      const bb = b > 0n ? b : -b;

      const c = gcd(aa, bb);

      if(c !== 1n){
        aNew = (pos ? aa : -aa) / c;
        bNew = bb / c;
      }
    }else{
      bNew = 1n;
    }

    this.#a = pos ?
      aNew > 0n ? aNew : -aNew :
      aNew > 0n ? -aNew : aNew;

    this.#b = bNew > 0n ? bNew : -bNew;

    return this;
  }

  toFloat(){
    return Number(this.#a) / Number(this.#b);
  }

  [Symbol.toPrimitive](){ assert.fail(); }
}

module.exports = Rational;