'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const rules = {
  script: e => new cs.Program(e.fst.fst),
  entityDefs: e => e.fst.arr,
  entityDef: e => e.fst.fst,
  typeDef: e => new cs.TypeDefinition(e.es[0].fst, e.es[2].jst, cs.Type.from(e.es[4].arr), e.es[6].jst),
  attribs: e => e.es[2].arr,
  attrib: e => new cs.Attribute(e.es[0].fst, e.es[2].fst),
  formalTemplates: e => e.es[2].arr,
  formalTemplate: e => new cs.Template(e.es[0].fst, cs.Type.from(e.es[2].arr)),
  extendedType: e => e.es[2].fst,
  type: e => e.fst.fst,
  baseType: e => cs.Type.base(),
  nonBaseType: e => new cs.Type(e.es[0].fst, e.es[2].jst),
  templates: e => e.es[2].arr,
  template: e => e.fst.fst,
  funcDef: e => new cs.FunctionDefinition(e.es[0].fst, e.es[2].jst, e.es[6].fst),
  formalArgs: e => e.es[2].arr,
  formalArg: e => new cs.FormalArgument(e.es[0].fst, O.last(e.es[2].arr)),
  expr: e => e.fst.fst,
  invocation: e => new cs.Invocation(e.es[0].fst, e.es[2].jst),
  attribAccess: e => new cs.AttributeAccess(e.es[0].fst, e.es[4].fst),
  args: e => e.es[2].arr,
  arg: e => e.fst.fst,
  ident: e => e.str,
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