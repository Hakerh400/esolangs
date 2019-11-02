'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const cs = require('./ctors');

const rules = {
  ['[script]']: e => {
    const firstInst = e.fst.fst;
    const mainBlock = new cs.Block(firstInst);

    for(let inst = firstInst; inst !== null; inst = inst.next)
      inst.parent = mainBlock;

    return mainBlock;
  },

  ['[insts]']: e => {
    const insts = e.es[1].arr;
    let inst = null;

    for(let i = insts.length - 1; i !== -1; i--){
      insts[i].next = inst;
      inst = insts[i];
    }

    return inst;
  },
  
  ['[inst]']: e => e.fst.fst,
  ['[move]']: e => e.fst.fst.toArr(),
  ['[inc]']: e => new cs.Increment(),
  ['[put]']: e => e.fst.fst,
  ['[control]']: e => e.fst.fst,
  ['[block]']: e => new cs.Block(e.es[1].fst),
  ['[putNum]']: e => new cs.PutNum(e.es[2].fst),
  ['[putArr]']: e => new cs.PutArr(e.es[2].fst),
  ['[if]']: e => e.fst.fst,
  ['[ifNz]']: e => e.fst.fst,
  ['[ifOdd]']: e => e.fst.fst,
  ['[ifBlock]']: e => e.fst.fst,
  ['[while]']: e => e.fst.fst,
  ['[whileNz]']: e => e.fst.fst,
  ['[whileOdd]']: e => e.fst.fst,
  ['[thread]']: e => e.fst.fst,
  ['[jump]']: e => e.fst.fst,
  ['[arr]']: e => new cs.Array(e.es[e.patIndex === 1 ? 2 : 0].arr),
  ['[arrSep]']: e => e.fst.fst,
  ['[num]']: e => new cs.Number(e | 0),
  ['[get]']: e => e.fst.fst,
  ['[getNum]']: e => new cs.GetNum(e.es[2].fst),
  ['[getArr]']: e => new cs.GetArr(e.es[2].fst),
  ['[bridge]']: e => e.fst.fst,
  ['[whitespace]']: e => e.fst.fst,
  ['[comment]']: e => e.fst.fst,
  ['[inlineComment]']: e => e.fst.fst,
  ['[multilineComment]']: e => e.fst.fst,
  ['[s]']: e => e.fst.fst,
  ['[s0]']: e => e.fst.fst,
  ['[s1]']: e => e.fst.fst,
};

module.exports = rules;