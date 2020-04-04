'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const rules = {
  script: e => new cs.Script(e.es[1].arr),
  stat: e => e.fst.fst,
  assignments: e => new cs.Assignments(e.fst.arr),
  assignment: e => new cs.Assignment(e.es[0].fst, e.es[4].fst),
  assignmentSep: e => e.fst.fst,
  control: e => e.fst.fst,
  if: e => new cs.If(e.es[2].fst, e.es[6].fst, O.fst(e.es[10].arr)),
  else: e => e.es[5].fst,
  elseBody: e => e.es[e.pti === 0 ? 0 : 2].fst,
  ifOrElseStr: e => e.fst.fst,
  ifComment: e => e.fst.fst,
  for: e => new cs.For(e.es[6].fst, e.es[10].fst, e.es[14].fst, e.es[20].fst),
  say: e => new cs.Say(e.es[2].fst, e.es[3].arr.length === 0),
  woutNewLine: e => e.fst.fst,
  end: e => new cs.End(),
  expr: e => cs.LogicalOperation.construct(e.fst.arr, e.fst.seps),
  exprPart: e => e.fst.fst,
  exprSep: e => e.es[1].fst,
  andOr: e => e.str,
  exprArithmetic: e => e.fst.fst,
  exprArithmeticOrTerm: e => e.fst.fst,
  exprCmp: e => e.fst.fst,
  exprTerm: e => e.fst.fst,
  add: e => new cs.Addition(e.es[0].fst, e.es[4].fst),
  sub: e => new cs.Subtraction(e.es[0].fst, e.es[4].fst),
  eq: e => new cs.Equals(e.es[0].fst, e.es[4].fst),
  lt: e => new cs.LessThan(e.es[0].fst, e.es[4].fst),
  gt: e => new cs.GreaterThan(e.es[0].fst, e.es[4].fst),
  le: e => new cs.LessThanOrEqual(e.es[0].fst, e.es[4].fst),
  ge: e => new cs.GreaterThanOrEqual(e.es[0].fst, e.es[4].fst),
  grouping: e => e.es[2].fst,
  ident: e => new cs.Identifier(e.str),
  int: e => new cs.Integer(BigInt(e.str)),
  string: e => new cs.String(JSON.parse(e.str)),
  stringChar: e => e.fst.fst,
  whitespace: e => e.fst.fst,
  comment: e => e.fst.fst,
  inlineComment: e => e.fst.fst,
  multilineComment: e => e.fst.fst,
  commentBody: e => e.fst.fst,
  commentEnd: e => e.fst.fst,
  s: e => e.fst.fst,
  s0: e => e.fst.fst,
  s1: e => e.fst.fst,
};

module.exports = rules;