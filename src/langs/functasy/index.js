'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

const run = (src, input) => {
  src = src.toString();

  const io = new O.IO(input, 0, 1);

  let s = [[]]; // Stack
  let e = 0; // Element

  // Tokenize and iterate over tokens
  for(let t of src.match(/\d+|[\(\)]/g) || [])
    t === ')' ?
      (e = s[0], s = s[1]) :
      (e = e ? e[2] = [] : s[0][1] = [],
      t === '(' ?
        (s = [e, s], e = 0) :
        e[0] = -~t);

  // Initial invocation parameters
  let inv = [0, [0, e = s[0][1]], 0, e];
  let e1, e2;

  // Some useful functions
  const ret = clos => (inv = inv[0]) && (inv[4] = clos);
  const next = e => ((e = inv[3]) && (inv[3] = inv[3][2]), e);
  const tc = e => e ? e[0] ? fetch(e[0]) : [inv, e[1]] : 0;
  const call = (func, arg) => inv = [
    inv[3] ? inv : inv = inv[0],
    func, arg, func[1]];
  const fetch = (i, j) => {
    let k = inv;
    while(--i) k = k[1][0];
    return j ? k[2] = j : k[2];
  };

  // The main program loop
  while(inv)
    (e1 = inv[4], e2 = next()) ?
      tc(e2)[1] ?
        e1 ? call(e1, tc(e2)) : inv[4] = tc(e2) :
        (e2 = next()) ?
          e2[0] ?
            e1 ? fetch(e2[0], e1) : (io.write(1), inv[4] = tc(e2)) :
            e1 ? call(tc(e2), e1) : io.read() ? call(tc(e2), []) : inv[4] = tc(e2) :
          e1 ? io.write(0) : ret([]) :
      ret(e1 || []);

  return io.getOutput();
};

module.exports = run;