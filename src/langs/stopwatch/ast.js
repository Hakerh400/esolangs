'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const rules = {
  script: e => new cs.Program(e.es[1].arr),
  func: e => new cs.Function(e.es[0].fst, e.es[2].fst, e.es[4].fst),
  formalArgs: e => e.es[2].arr,
  body: e => e.fst.fst,
  block: e => new cs.Block(e.es[2].arr),
  stat: e => e.fst.fst,
  exprStat: e => new cs.ExpressionStatement(e.fst.fst),
  assign: e => new cs.Assignment(e.es[0].fst, e.es[4].fst),
  varDef: e => new cs.VariableDefinition(e.es[2].fst),
  parallel: e => new cs.Parallel(e.es[2].fst),
  do: e => new cs.Do(e.es[2].fst),
  repeat: e => new cs.Repeat(e.es[2].fst),
  forSplits: e => new cs.ForSplits(e.es[4].arr, e.es[8].fst),
  expr: e => e.fst.fst,
  return: e => new cs.Return(e.es[1].fst),
  wait: e => new cs.Wait(),
  out: e => new cs.Out(e.es[1].fst),
  expr: e => e.fst.fst,
  exprWoutGroup: e => e.fst.fst,
  exprWithSep: e => e.es[1].fst,
  watch: e => new cs.Watch(),
  start: e => new cs.Start(e.es[1].fst),
  sleep: e => new cs.Sleep(e.es[1].fst),
  split: e => new cs.Split(e.es[1].fst),
  step: e => new cs.Step(e.es[1].fst),
  time: e => new cs.Time(e.es[1].fst),
  stop: e => new cs.Stop(e.es[1].fst),
  call: e => new cs.Call(e.es[0].fst, e.es[2].fst),
  args: e => e.es[2].arr,
  var: e => e.fst.fst,
  group: e => e.fst.fst,
  ident: e => e.str,
  literal: e => e.fst.fst,
  int: e => new cs.Integer(BigInt(e.str)),
  commaSep: e => e.fst.fst,
  newLineSep: e => e.fst.fst,
  whitespace: e => e.fst.fst,
  comment: e => e.fst.fst,
  inlineComment: e => e.fst.fst,
  multilineComment: e => e.fst.fst,
  s: e => e.fst.fst,
  s0: e => e.fst.fst,
  s1: e => e.fst.fst,
};

module.exports = rules;