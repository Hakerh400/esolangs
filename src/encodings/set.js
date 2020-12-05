'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('..');

const encode = buf => {
  const str = buf.toString().replace(/\s+/g, '');
  const ser = new O.NatSerializer();

  if(/[^\{\}\,]/.test(str))
    return null;

  const set = O.rec(parse, str);
  if(set === null) return null;

  const stack = [[set, 0]];

  while(stack.length !== 0){
    do{
      const last = O.last(stack);
      const [set, index] = last;

      if(index === set.length){
        if(stack.length !== 1)
          ser.write(0);

        stack.pop();
        continue;
      }

      const elem = set[index];

      stack.push([elem, 0]);
      last[1]++;

      if(stack.length !== 2){
        const prev = stack[stack.length - 3];

        if(prev[1] !== 1){
          const prevSet = prev[0][prev[1] - 2];

          if(O.rec(cmp, prevSet, set.slice(0, index)) >= 0)
            continue;
        }

        ser.write(1);
        continue;
      }

      ser.inc();
    }while(0);
  }

  return ser.output;
};

const decode = num => {
  const ser = new O.NatSerializer(num);

  const set = [];
  const stack = [set];

  const push = () => {
    const set = O.last(stack);
    const setNew = [];

    set.push(setNew);
    stack.push(setNew);
  };

  while(stack.length !== 0){
    const set = O.last(stack);

    if(stack.length === 1){
      if(!ser.nz) break;
      push();
      continue;
    }

    const prev = stack[stack.length - 2];

    if(prev.length !== 1){
      const prevSet = prev[prev.length - 2];

      if(O.rec(cmp, prevSet, set) >= 0){
        push();
        continue;
      }
    }

    if(ser.read()){
      push();
      continue;
    }

    stack.pop();
  }
  
  return Buffer.from(O.rec(stringify, set));
};

const parse = function*(str, index=[0], depth=1){
  if(index[0] === str.length) return null;
  if(str[index[0]] !== '{') return null;

  index[0]++;

  const set = [];

  while(1){
    if(index[0] === str.length) return null;

    const c = str[index[0]];

    if(c === '}'){
      index[0]++;
      break;
    }

    if(set.length === 0){
      if(c !== '{') return null;
    }else{
      if(c !== ',') return null;
      index[0]++;
    }

    set.push(yield [parse, str, index, depth + 1]);
  }

  if(depth === 1 && index[0] !== str.length)
    return null;

  yield O.tco(sanitize, set);
};

const sanitize = function*(set){
  for(let i = 0; i < set.length; i++){
    for(let j = i + 1; j < set.length; j++){
      const result = yield [cmp, set[i], set[j]];

      if(result < 0) continue;

      if(result > 0){
        const t = set[i];
        set[i] = set[j];
        set[j] = t;
        continue;
      }

      const last = set.pop();
      if(j === set.length) continue;

      set[j--] = last;
    }
  }

  return set;
};

const cmp = function*(set1, set2){
  const len1 = set1.length;
  const len2 = set2.length;

  if(len1 < len2) return -1;
  if(len1 > len2) return 1;

  for(let i = 0; i !== len1; i++){
    const result = yield [cmp, set1[i], set2[i]];
    if(result !== 0) return result;
  }

  return 0;
};

const stringify = function*(set){
  let str = '{';

  for(let i = 0; i !== set.length; i++){
    if(i !== 0) str += ', ';
    str += yield [stringify, set[i]];
  }

  return str + '}';
};

module.exports = {
  encode,
  decode,
};