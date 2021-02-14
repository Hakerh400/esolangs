'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');

const run = (src, input) => {
  src = src.toString().replace(/\s+/g, '');

  if(!/^(?:0|[1-9][0-9]*)$/.test(src))
    esolangs.err(`Source code must be a non-negative integer`);

  src = BigInt(src);

  let e = 2n;
  while(src % e) e++;

  let n = f1(e, src / e, f1(e, 0n, f4(e, BigInt(input))));

  while(1){
    const a = f2(e, n);
    const b = f2(e, a);
    if(b === 0n) break;

    const c = f3(e, a);
    const d = f6(e, c, b - 1n);
    const g = f2(e, d) & 3n;
    const h = f3(e, d);

    const i = f3(e, n);
    const j = f2(e, i);
    const k = f3(e, i);

    if(g === 0n){
      n = f1(e, f1(e, h, c), f1(e, j / e * e + e - j % e - 1n, k));
      continue;
    }

    if(g === 1n){
      n = f1(e, f1(e, h, c), f1(e, k, j));
      continue;
    }

    if(g === 2n){
      n = f1(e, f1(e, h, c), f1(e, j * e, k));
      continue;
    }

    if(g === 3n){
      n = f1(e, f1(e, j % e ? f3(e, h) : f2(e, h), c), f1(e, j / e, k));
      continue;
    }

    assert.fail(String(g));
  }

  return Buffer.from(String(f5(e, f3(e, f3(e, n)))));
};

const f1 = (...args) => O.rec(g1, ...args);
const f2 = (...args) => O.rec(g2, ...args);
const f3 = (...args) => O.rec(g3, ...args);
const f4 = (...args) => O.rec(g4, ...args);
const f5 = (...args) => O.rec(g5, ...args);
const f6 = (...args) => O.rec(g6, ...args);

const g1 = function*(e, a, b){
  if(a + b)
    return a % e + e * (b % e + e * (yield [g1, e, a / e, b / e]));

  return 0n;
};

const g2 = function*(e, a){
  if(a)
    return a % e + e * (yield [g2, e, a / (e * e)]);

  return 0n;
};

const g3 = function*(e, a){
  yield O.tco(g2, e, a / e);
};

const g4 = function*(e, a){
  return e ** a - 1n;
};

const g5 = function*(e, a){
  if(a % e)
    return 1n + (yield [g5, e, a / e]);

  return 0n;
};

const g6 = function*(e, a, b){
  if(b)
    yield O.tco(g6, e, yield [g3, e, a], b - 1n);

  yield O.tco(g2, e, a);
};

module.exports = run;