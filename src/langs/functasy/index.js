'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

const run = (src, input) => {
  src = src.toString();

  const io = new O.IOBit(input);

  let s = [[]]; // Stack
  let e = 0; // Element
  let d = 0; // Depth

  const parseIdent = identStr => {
    if(identStr[0] === '0' && identStr.length !== 1)
      esolangs.err(`Invalid identifier ${identStr}`);

    const ident = identStr | 0;

    if(ident >= d)
      esolangs.err(`Identifier ${identStr} cannot appear in that context`);

    return ident + 1;
  };

  // Tokenize and iterate over tokens
  O.tokenize(src, [
    /\s+/, O.nop,

    /[0-9]+|[\(\)]/, t => {
      if(t === ')'){
        if(d === 0)
          esolangs.err(`Missing open parenthese`);

        e = s[0];
        s = s[1];
        d--;

        return;
      }

      e = e ? e[2] = [] : s[0][1] = [];

      if(t === '('){
        s = [e, s];
        e = 0;
        d++;

        return;
      }

      e[0] = parseIdent(t);
    },

    t => {
      esolangs.err(`Invalid syntax near ${O.sf(t.slice(0, 100))}`);
    },
  ]);

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

class IO{
  output = [];

  constructor(input){
    this.input = input;
    this.inputIndex = 0;
    this.inputFlag = 1;
  }

  read(){
    const {input, inputFlag} = this;
    if(this.inputIndex === input.length) return 0;

    this.inputFlag ^= 1;
    if(inputFlag) return 1;

    return input[this.inputIndex++] | 0;
  }

  write(bit){
    this.output.push(bit | 0);
  }

  getOutput(){
    return Buffer.from(this.output.join(''));
  }
}

module.exports = run;