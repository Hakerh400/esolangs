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

const f1 = (e, a, b) => a + b ? a % e + e * (b % e + e * f1(e, a / e, b / e)) : 0n;
const f2 = (e, a) => a ? a % e + e * f2(e, a / (e * e)) : 0n;
const f3 = (e, a) => f2(e, a / e);
const f4 = (e, a) => e ** a - 1n;
const f5 = (e, a) => a % e ? 1n + f5(e, a / e) : 0n;
const f6 = (e, a, b) => b ? f6(e, f3(e, a), b - 1n) : f2(e, a);

module.exports = run;