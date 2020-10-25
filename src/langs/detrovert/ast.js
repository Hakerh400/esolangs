'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const prog = e => {
  return cs.Program.fromAst(e.ast);
};

const rules = {
  script: e => prog(e).addPatterns(e.es[3].arr),
  typeDefs: e => prog(e).sanitizeTypes(),
  typeDef: e => new cs.Type(prog(e), e.es[0].fst, O.last(e.es[1].arr), e.es[5].arr),
  ext: e => e.es[3].fst,
  attrDef: e => new cs.AttributeDef(e.es[0].fst, e.es[2].fst),
  pattern: e => new cs.Pattern(e.es[2].arr, e.es[6].arr),
  match: e => new cs.Match(prog(e), e.es[2].fst, e.es[0].fst, e.es[4].fst),

  tform: e => {
    const tformType = O.last(e.es[0].arr, [0, null]);
    const [ths, type] = tformType;
    const name = e.es[1].fst;
    const attrs = e.es[3].fst;

    if(type === null)
      return new cs.Update(name, attrs, ths);

    return new cs.Construct(prog(e), name, type, attrs, ths);
  },

  tformType: e => {
    if(e.pti === 0)
      return [O.last(e.es[0].arr, 0), null];

    return [e.es[1].fst, e.es[0].fst];
  },

  ths: e => {
    if(e.pti === 0)
      return e.es[1].arr.length;

    return 0;
  },

  attribs: e => e.es[2].arr,
  attrib: e => new cs.AttributeRef(e.es[0].fst, e.es[2].fst),
  type: e => e.str,
  ident: e => e.fst.fst,
  whitespace: e => e.fst.fst,
  comment: e => e.fst.fst,
  inlineComment: e => e.fst.fst,
  multilineComment: e => e.fst.fst,
  s: e => e.fst.fst,
  s0: e => e.fst.fst,
  s1: e => e.fst.fst,
};

module.exports = rules;