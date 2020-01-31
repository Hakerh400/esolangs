'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');
const keywords = require('./keywords');

const rules = {
  script: e => e.es[1].arr,
  class: e => cs.Class.construct(e.es[2].fst, O.last(e.es[4].arr), e.es[6].fst),
  classBody: e => e.pti === 0 ? e.es[2].arr : null,
  extends: e => e.es[2].fst,
  classEntity: e => e.fst.fst,
  attribute: e => new cs.Attribute(e.es[2].fst, e.es[0].fst),
  method: e => cs.Method.construct(e.es[2].fst, e.es[0].fst, e.es[6].fst, e.es[10].fst),
  methodBody: e => e.pti === 0 ? e.es[4].fst : null,
  formalArgs: e => e.fst.arr,
  formalArg: e => new cs.FormalArgument(e.es[2].fst, e.es[0].fst),
  expr: e => e.fst.fst,
  this: e => new cs.This(),
  super: e => new cs.MethodCall(new cs.Super(), e.es[4].fst, e.es[7].fst),
  exprIdent: e => new cs.Identifier(e.str),
  instantiation: e => new cs.Instantiation(e.es[2].fst),
  methodCall: e => new cs.MethodCall(e.es[0].fst, e.es[4].fst, e.es[7].fst),
  args: e => e.fst.arr,
  grouping: e => e.es[1].fst,
  ident: e => {
    const name = e.str;
    if(keywords.includes(name))
      esolangs.err(`${O.sf(name)} is a reserved keyword`);
    return name;
  },
  commaSep: e => e.fst.fst,
  whitespace: e => e.fst.fst,
  comment: e => e.fst.fst,
  inlineComment: e => e.fst.fst,
  multilineComment: e => e.fst.fst,
  s: e => e.fst.fst,
  s0: e => e.fst.fst,
  s1: e => e.fst.fst,
};

module.exports = rules;