'use strict';

const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');
const tokenizer = require('./tokenizer');

const {min, max} = Math;
const {term} = cs.Term;

const parse = (str, type='prog') => {
  const toks = tokenizer.tokenize(str.toString());
  const prog = O.rec(funcs[type], [toks, 0]);

  return prog;
};

const parseProg = function*(toks){
  const rules = [];

  while(toks[1] !== toks[0].length)
    rules.push(yield [parseRule, toks]);

  return new cs.Program(rules);
};

const parseRule = function*(toks){
  return new cs.Rule(
    yield [parseLhs, toks],
    yield [parseRhs, toks],
  );
};

const parseLhs = function*(toks){
  return yield [parseExpr, toks, 0];
};

const parseRhs = function*(toks){
  return yield [parseExpr, toks, 1];
};

const parseExpr = function*(toks, rhs){
  if(toks[1] === toks[0].length)
    err(toks, `Unexpected end of the source code`);

  const tok = toks[0][toks[1]++];
  let parsed = null;

  switch(tok){
    case '.': {
      parsed = term;
    } break;

    case '(': {
      parsed = new cs.Pair(
        yield [parseExpr, toks, rhs],
        yield [parseExpr, toks, rhs],
      );

      if(toks[1] === toks[0].length)
        err(toks, `Expected a closed parenthese, but found the end of the source code`);

      const c = toks[0][toks[1]++];

      if(c !== ')')
        err(toks, `Expected a closed parenthese, but found ${O.sf(c)}`);
    } break;

    case ')': {
      err(toks, `Unexpected closed parenthese`);
    } break;

    case '*': {
      if(!rhs)
        err(toks, `The ${O.sf(tok)} command can only be used on the rhs`);

      parsed = new cs.Call(yield [parseExpr, toks, rhs]);
    } break;

    default: {
      parsed = new cs.Identifier(tok);
    } break;
  }

  return parsed;
};

const err = (toks, msg) => {
  const start = max(toks[1] - 1, 0);
  esolangs.err(`${msg}\nNear ${O.sf(toks[0].slice(start).join(' '))}`);
};

const funcs = {
  parse,
  prog: parseProg,
  rule: parseRule,
  lhs: parseLhs,
  rhs: parseRhs,
  expr: parseExpr,
};

module.exports = funcs;