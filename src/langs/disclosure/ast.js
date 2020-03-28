'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const cs = require('./ctors');

const rules = {
  script: e => new cs.Global(e.es[1].arr),
  globalEntity: e => e.fst.fst,
  funcDef: e => new cs.FunctionDef(e.es[2].fst, e.es[0].fst, e.es[6].fst, e.es[10].fst),
  varDef: e => new cs.VariableDef(e.es[2].fst, e.es[0].fst, O.last(e.es[4].arr)),
  varInit: e => e.es[2].fst,
  type: e => new cs.PrimitiveType(e.es[2].arr.length, e.fst.fst),
  typeName: e => e.fst.fst,
  formalArgs: e => e.fst.arr,
  formalArg: e => new cs.FormalArgument(e.es[2].fst, e.es[0].fst),
  formalArgSep: e => e.fst.fst,
  funcBody: e => e.fst.fst,
  codeBlock: e => new cs.CodeBlock(e.es[2].arr),
  statement: e => e.fst.fst,
  control: e => e.fst.fst,
  if: e => new cs.If(e.es[4].fst, new cs.CodeBlock([e.es[8].fst]), new cs.CodeBlock(e.es[10].arr)),
  else: e => e.es[2].fst,
  while: e => new cs.While(e.es[4].fst, new cs.CodeBlock([e.es[8].fst])),
  return: e => new cs.Return(O.last(e.es[2].arr)),
  asm: e => new cs.Asm(e.es[4].arr),
  inst: e => new cs.Instruction(String(e.es[0].fst).trim()),
  exprStat: e => new cs.ExpressionStatement(e.fst.fst),
  expr: e => e.fst.fst,
  expr1_: e => e.fst.fst,
  expr2_: e => e.fst.fst,
  expr3_: e => e.fst.fst,
  expr4_: e => e.fst.fst,
  expr5_: e => e.fst.fst,
  expr6_: e => e.fst.fst,
  expr7_: e => e.fst.fst,
  expr8_: e => e.fst.fst,
  expr9_: e => e.fst.fst,
  expr10_: e => e.fst.fst,
  expr11_: e => e.fst.fst,
  expr12_: e => e.fst.fst,
  expr13_: e => e.fst.fst,
  expr14_: e => e.fst.fst,
  expr15_: e => e.fst.fst,
  expr16_: e => e.fst.fst,
  expr17_: e => e.fst.fst,
  expr18_: e => e.fst.fst,
  expr19_: e => e.fst.fst,
  expr20_: e => e.fst.fst,
  expr21_: e => e.fst.fst,
  expr1: e => e.fst.fst,
  expr2: e => e.fst.fst,
  expr3: e => e.fst.fst,
  expr4: e => e.fst.fst,
  expr5: e => e.fst.fst,
  expr6: e => e.fst.fst,
  expr7: e => e.fst.fst,
  expr8: e => e.fst.fst,
  expr9: e => e.fst.fst,
  expr10: e => e.fst.fst,
  expr11: e => e.fst.fst,
  expr12: e => e.fst.fst,
  expr13: e => e.fst.fst,
  expr14: e => e.fst.fst,
  expr15: e => e.fst.fst,
  expr16: e => e.fst.fst,
  expr17: e => e.fst.fst,
  expr18: e => e.fst.fst,
  expr19: e => e.fst.fst,
  expr20: e => e.fst.fst,
  expr21: e => e.fst.fst,
  assign: e => new cs.Assignment(e.es[0].fst, e.es[4].fst),
  bOr: e => new cs.BitwiseOr(e.es[0].fst, e.es[4].fst),
  add: e => new cs.Addition(e.es[0].fst, e.es[4].fst),
  sub: e => new cs.Subtraction(e.es[0].fst, e.es[4].fst),
  mul: e => new cs.Multiplication(e.es[0].fst, e.es[4].fst),
  div: e => new cs.Division(e.es[0].fst, e.es[4].fst),
  mod: e => new cs.Modulo(e.es[0].fst, e.es[4].fst),
  call: e => new cs.Call(e.fst.fst, e.es[4].fst),
  unaryPlus: e => new cs.UnaryPlus(e.es[2].fst),
  unaryMinus: e => new cs.UnaryMinus(e.es[2].fst),
  takeAddr: e => new cs.TakeAddress(e.es[2].fst),
  deref: e => new cs.Dereference(e.es[2].fst),
  args: e => e.fst.arr,
  argSep: e => e.fst.fst,
  grouping: e => e.es[1].fst,
  ident: e => new cs.Identifier(e.str),
  literal: e => e.fst.fst,
  number: e => e.fst.fst,
  integer: e => new cs.Integer(BigInt(e.str)),
  whitespace: e => e.fst.fst,
  comment: e => e.fst.fst,
  inlineComment: e => e.fst.fst,
  multilineComment: e => e.fst.fst,
  s: e => e.fst.fst,
  s0: e => e.fst.fst,
  s1: e => e.fst.fst,
};

module.exports = rules;