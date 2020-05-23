'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const rules = {
  script: e => new cs.Prgram(e.es[1].arr),
  cmd: e => e.fst.fst,
  passive: e => e.fst.fst,
  active: e => e.fst.fst,
  closedBracket: e => new cs.ClosedBracket(),
  plus: e => new cs.Plus(e.fst.fst),
  asterisk: e => new cs.Asterisk(e.fst.fst, e.es[2].fst),
  openBracket: e => new cs.OpenBracket(e.fst.fst),
  equalsSign: e => new cs.EqualsSign(e.fst.fst),
  exclamationMark: e => new cs.ExclamationMark(e.fst.fst),
  ident: e => e.str,
  whitespace: e => e.fst.fst,
  comment: e => e.fst.fst,
  s: e => e.fst.fst,
  s0: e => e.fst.fst,
  s1: e => e.fst.fst,
};

module.exports = rules;