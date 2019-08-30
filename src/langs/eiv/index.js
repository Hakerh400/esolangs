'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

const run = (src, input) => {
  src = src.toString();

  const io = new O.IO(input, 0, 1);
  const stack = [];

  O.tokenize(src, [
    /\s+/, O.nop,

    /[a-zA-Z0-9_]+(?:\s*[a-zA-Z0-9_]+)*\s*\./, (str, gs) => {
      for(const id of str.match(/[a-zA-Z0-9_]+/g)){
        const def = [1, null];
        def.arg = id;
        stack.push(def);
      }
    },

    /[a-zA-Z0-9_]+/, (str, gs) => {
      let inv = null

      for(let i = stack.length - 1; i !== -1; i--){
        const elem = stack[i];
        if(elem[0] !== 1 || O.last(elem) !== null) continue;
        if(elem.arg === str){
          inv = elem;
          break;
        }
      }

      if(inv === null) throw new SyntaxError(`Identifier ${O.sf(str)} is not bound to any abstraction`);

      const ident = [0, inv];
      const last = O.last(stack);

      if(O.last(last) === null){
        stack.push(ident);
        return;
      }
      
      O.setLast(stack, [2, last, ident]);
    },

    /\(/, (str, gs) => {
      stack.push([3, null]);
    },

    /\)/, (str, gs) => {
      const last = O.last(stack);
      if(last === null) throw new SyntaxError(`Unmatched closed parenthese`);
      if(O.last(last) === null) throw new SyntaxError(`${last[0] === 1 ? 'Abstraction' : 'Parenthesis'} cannot be empty`);

      while(stack.length !== 1){
        const elem2 = stack.pop();
        const elem1 = O.last(stack);

        if(elem1[0] === 3){
          O.setLast(stack, elem2);

          if(stack.length !== 1){
            const prev = stack[stack.length - 2];
            if(O.last(prev) !== null){
              const last = stack.pop();
              O.setLast(stack, [2, prev, last]);
            }
          }

          return;
        }

        if(O.last(elem1) === null) O.setLast(elem1, elem2);
        else O.setLast(stack, [2, elem1, elem2]);
      }

      throw new SyntaxError(`Unmatched closed parenthese`);
    },
  ], 1, 1);

  if(stack.length === 0) throw new SyntaxError(`Expected at least one identifier`);

  while(stack.length !== 1){
    const elem2 = stack.pop();
    const elem1 = O.last(stack);
    if(elem1[0] === 3) throw new SyntaxError(`Unmatched open parenthese`);

    if(O.last(elem1) === null) O.setLast(elem1, elem2);
    else O.setLast(stack, [2, elem1, elem2]);
  }

  if(stack[0][0] === 3) throw new SyntaxError(`Unmatched open parenthese`);

  const cc = O.cc('a');
  const sym1 = Symbol();
  const sym2 = Symbol();

  const stringify = expr => {
    const stack = [expr, -1];
    let s = '';

    const depths = new Map();

    while(stack.length !== 0){
      const top = stack.pop();

      if(top === sym1){
        if(stack[stack.length - 2][0] !== 0){
          stack.splice(stack.length - 2, 0, sym2);
          s += '(';
        }
        continue;
      }

      if(top === sym2){
        s += ')';
        continue;
      }

      const depth = top;
      const elem = stack.pop();
      const type = elem[0];

      if(type === 0){
        s += O.sfcc(cc + depths.get(elem[1]));
      }else if(type === 1){
        const d = depth + 1;
        depths.set(elem, d);
        stack.push(elem[1], d);
        s += O.sfcc(cc + d);
        if(elem[1][0] !== 1) s += '.';
      }else{
        stack.push(elem[2], depth, sym1);
        if(elem[1][0] === 1){
          stack.push(sym2);
          s += '(';
        }
        stack.push(elem[1], depth);
      }
    }

    return s;
  };

  const copy = expr => {
    const copy = expr.slice();
    const stack = [copy];
    const map = new Map();

    if(expr[0] === 1) map.set(expr, copy);

    while(stack.length !== 0){
      const elem = stack.pop();
      const type = elem[0];

      if(type === 0){
        const abs = elem[1];
        if(map.has(abs)) elem[1] = map.get(abs);
        continue;
      }

      const elem1 = elem[1];
      const copy1 = elem[1] = elem1.slice();
      stack.push(copy1);
      if(elem1[0] === 1) map.set(elem1, copy1);

      if(type === 2){
        const elem2 = elem[2];
        const copy2 = elem[2] = elem2.slice();
        stack.push(copy2);
        if(elem2[0] === 1) map.set(elem2, copy2);
      }
    }

    return copy;
  };

  const isBetaRedex = expr => {
    return expr[0] === 2 && expr[1][0] === 1;
  };

  const betaReduce = expr => {
    const abs = expr[1];
    const arg = expr[2];
    const stack = [abs];

    while(stack.length !== 0){
      const elem = stack.pop();
      const type = elem[0];

      const elem1 = elem[1];
      if(elem1[0] === 0){
        if(elem1[1] === abs) elem[1] = copy(arg);
      }else{
        stack.push(elem1);
      }

      if(type === 2){
        const elem2 = elem[2];
        if(elem2[0] === 0){
          if(elem2[1] === abs) elem[2] = copy(arg);
        }else{
          stack.push(elem2);
        }
      }
    }

    return abs[1];
  };

  const isEtaRedex = expr => {
    if(expr[0] !== 1) return 0;

    const inv = expr[1];
    if(inv[0] !== 2) return 0;

    const ident = inv[2];
    if(ident[0] !== 0 || ident[1] !== expr) return 0;

    const stack = [inv[1]];

    while(stack.length !== 0){
      const elem = stack.pop();
      const type = elem[0];

      if(type === 0){
        if(elem[1] === expr) return 0;
        continue;
      }

      stack.push(elem[1]);
      if(type === 2) stack.push(elem[2]);
    }

    return 1;
  };

  const etaReduce = expr => {
    return expr[1][1];
  };

  let a1, a2, a3;
  let i1, i2, i3, i4;

  const zero = [1, a1 = [1, i1 = [0, null]]];
  i1[1] = a1;

  const one = a1 = [1, [1, i1 = [0, null]]];
  i1[1] = a1;

  const pair = a1 = [1, a2 = [1, a3 = [1, [2, [2, i1 = [0, null], i2 = [0, null]], i3 = [0, null]]]]];
  i1[1] = a3; i2[1] = a2; i3[1] = a1;

  const eof = [2,
    a1 = [1, [2, i1 = [0, null], i2 = [0, null]]],
    a2 = [1, [2, [2, copy(pair), copy(zero)], [2, i3 = [0, null], i4 = [0, null]]]],
  ];
  i1[1] = a1; i2[1] = a1; i3[1] = a2; i4[1] = a2;

  const isZero = e => {
    return e[0] === 1 &&
      e[1][0] === 1 &&
      e[1][1][0] === 0 &&
      e[1][1][1] === e[1];
  };

  const isOne = e => {
    return e[0] === 1 &&
      e[1][0] === 1 &&
      e[1][1][0] === 0 &&
      e[1][1][1] === e;
  };

  const eofCopy = copy(eof);
  const inputExpr = [2, null, eofCopy];
  let currExpr = inputExpr;

  while(io.read()){
    currExpr[2] = [2,
      [2, copy(pair), copy(one)],
      [2, [2, copy(pair), copy(io.read() ? one : zero)], eofCopy],
    ];
    currExpr = currExpr[2][2];
  }

  let mainExpr = [2, stack[0], inputExpr[2]];
  let flag = 0;

  while(1){
    simpleReduce: while(1){
      if(isEtaRedex(mainExpr)){
        mainExpr = etaReduce(mainExpr);
        continue;
      }

      if(isBetaRedex(mainExpr)){
        mainExpr = betaReduce(mainExpr);
        continue;
      }

      let elem = mainExpr;
      while(elem[0] === 2){
        const elem1 = elem[1];
        if(isBetaRedex(elem1)){
          elem[1] = betaReduce(elem1);
          continue simpleReduce;
        }
        elem = elem1;
      }

      break;
    }

    let bit = [2, copy(mainExpr), copy(zero)];

    for(let i = 0; i !== 2; i++){
      while(1){
        if(i ? isEtaRedex(bit) : isBetaRedex(bit)){
          bit = i ? etaReduce(bit) : betaReduce(bit);
          continue;
        }

        const stack = [bit];
        const invs = new Set();
        let found = 0;

        while(stack.length !== 0){
          const elem = stack.pop();
          const type = elem[0];
          if(type === 0) continue;

          if(type === 1 || type === 2 && !invs.has(elem)){
            const elem1 = elem[1];
            if(i ? isEtaRedex(elem1) : isBetaRedex(elem1)){
              elem[1] = i ? etaReduce(elem1) : betaReduce(elem1);
              found = 1;
              break;
            }

            if(type === 2){
              invs.add(elem);
              stack.push(elem);
            }

            stack.push(elem1);
            continue;
          }

          const elem2 = elem[2];
          if(i ? isEtaRedex(elem2) : isBetaRedex(elem2)){
            elem[2] = i ? etaReduce(elem2) : betaReduce(elem2);
            found = 1;
            break;
          }
          stack.push(elem2);
        }

        if(!found) break;
      }
    }

    mainExpr = [2, mainExpr, copy(one)];

    const b0 = isZero(bit);
    const b1 = isOne(bit);
    if(!(b0 || b1)) throw new TypeError('Invalid output');

    if(flag = !flag){
      if(b0) break;
      continue;
    }

    io.write(b1);
  }

  return io.getOutput();
};

module.exports = run;