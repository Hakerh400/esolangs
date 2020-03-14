'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');
const cmds = require('./cmds');
const conds = require('./conds');

const rules = {
  script: e => new cs.Program(e.es[0].fst, e.es[2].fst),
  tapeSize: e => BigInt(e.str),
  insts: e => e.es[1].arr,
  inst: e => e.fst.fst,
  if: e => new cs.If(e.es[2].fst, e.es[6].fst, e.es[10].jst),
  else: e => e.es[4].fst,
  loop: e => new cs.Loop(e.es[2].fst, e.es[6].fst),
  cond: e => new cs.Condition(e.es[2].fst, e.es[0].arr.length === 1),
  cmd: e => e.fst.fst,
  condType: e => e.fst.fst,
  goUp: e => new cs.Command(cmds.goUp),
  goDown: e => new cs.Command(cmds.goDown),
  goLeft: e => new cs.Command(cmds.goLeft),
  goRight: e => new cs.Command(cmds.goRight),
  tapeLeft: e => new cs.Command(cmds.tapeLeft),
  tapeRight: e => new cs.Command(cmds.tapeRight),
  flipBit: e => new cs.Command(cmds.flipBit),
  flipCity: e => new cs.Command(cmds.flipCity),
  home: e => new cs.Command(cmds.home),
  isCity: e => conds.isCity,
  isCityUp: e => conds.isCityUp,
  isCityDown: e => conds.isCityDown,
  isCityLeft: e => conds.isCityLeft,
  isCityRight: e => conds.isCityRight,
  isBit: e => conds.isBit,
  isFull: e => conds.isFull,
  whitespace: e => e.fst.fst,
  comment: e => e.fst.fst,
  inlineComment: e => e.fst.fst,
  multilineComment: e => e.fst.fst,
  s: e => e.fst.fst,
  s0: e => e.fst.fst,
  s1: e => e.fst.fst,
};

module.exports = rules;