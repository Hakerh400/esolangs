'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const cs = require('./ctors');

const rules = {
  ['[script]']: e => {
    const mainBlock = new cs.Block(e.fst.fst);

    cs.Instruction.resolveNext();
    cs.Block.resolveInsts();

    return mainBlock;
  },

  ['[insts]']: e => e.es[1].arr,
  ['[inst]']: e => e.fst.fst,
  ['[move]']: e => new cs.Move(e.fst.fst),
  ['[inc]']: e => new cs.Increment(),
  ['[put]']: e => e.fst.fst,
  ['[control]']: e => e.fst.fst,
  ['[block]']: e => new cs.Block(e.es[1].fst),
  ['[putNum]']: e => new cs.PutNumber(e.es[2].fst),
  ['[putArr]']: e => new cs.PutArray(e.es[2].fst),
  ['[if]']: e => e.fst.fst,
  ['[ifNz]']: e => new cs.IfNz(...e.es[2].fst),
  ['[ifOdd]']: e => new cs.IfOdd(...e.es[2].fst),
  ['[ifBlock]']: e => e.es[1].arr.map(a => new cs.Block(a)),
  ['[while]']: e => e.fst.fst,
  ['[whileNz]']: e => new cs.WhileNz(e.es[2].fst),
  ['[whileOdd]']: e => new cs.WhileOdd(e.es[2].fst),
  ['[thread]']: e => e.fst.fst,
  ['[jump]']: e => e.fst.fst,
  ['[arr]']: e => new cs.Array(e.es[e.patIndex === 2 ? 2 : 0].arr),
  ['[emptyArr]']: e => new cs.Array(),
  ['[arrSep]']: e => e.fst.fst,
  ['[num]']: e => new cs.Number(e | 0),
  ['[get]']: e => e.fst.fst,
  ['[getNum]']: e => new cs.GetNumber(e.es[2].fst),
  ['[getArr]']: e => new cs.GetArray(e.es[2].fst),
  ['[bridge]']: e => new cs.Bridge(e.es[2].fst),
  ['[whitespace]']: e => e.fst.fst,
  ['[comment]']: e => e.fst.fst,
  ['[inlineComment]']: e => e.fst.fst,
  ['[multilineComment]']: e => e.fst.fst,
  ['[s]']: e => e.fst.fst,
  ['[s0]']: e => e.fst.fst,
  ['[s1]']: e => e.fst.fst,
};

module.exports = rules;