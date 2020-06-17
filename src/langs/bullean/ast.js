'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const rules = {
  script: e => new cs.Program(e.es[1].arr),
  elem: e => e.fst.fst,
  num: e => cs.Number.fromStr(e.str),
  bind: e => new cs.Bind(),
  call: e => new cs.Call(),
  bindAndCall: e => new cs.BindAndCall(),
  clean: e => new cs.Clean(),
  in: e => new cs.Input(),
  out: e => new cs.Output(),
  group: e => new cs.Group(e.es[2].arr),
  b: e => e.fst.fst,
  whitespace: e => e.fst.fst,
  comment: e => e.fst.fst,
  inlineComment: e => e.fst.fst,
  multilineComment: e => e.fst.fst,
  s: e => e.fst.fst,
  s0: e => e.fst.fst,
  s1: e => e.fst.fst,
};

module.exports = rules;