'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');
const parser = require('./parser');
const solver = require('./solver');
const cs = require('./ctors');

const {types} = cs;

const {
  DNF, SYSTEM,
  EQ, NEQ,
  TERM, PAIR, IDENT, CALL,
} = types;

const run = (src, input) => {
  const prog = parser.parse(src);
  const {rules} = prog;

  const inputExpr = cs.Expression.fromBin(String(input));
  const mainExpr = new cs.Call(new cs.Pair(cs.Term.term, inputExpr));

  const reduce = function*(expr){
    if(expr.reduced) return expr;

    const {type} = expr;

    switch(type){
      case PAIR: {
        return new cs.Pair(
          yield [reduce, expr.fst],
          yield [reduce, expr.snd],
        );
      } break;

      case CALL: {
        const target = yield [reduce, expr.target];
        const rule = yield [findRule, target];

        return yield [reduce, rule.apply(target)];
      } break;

      default:
        assert.fail(types[type]);
        break;
    }
  };

  const findRule = function*(expr, rs=rules){
    assert(expr.reduced);

    for(const rule of rs)
      if(yield [[expr, 'sub'], rule.lhs])
        return (yield [findRule, expr, rule.subs]) || rule;

    return null;
  };

  const outputExpr = O.rec(reduce, mainExpr);

  return Buffer.from(outputExpr.toBin());
};

module.exports = run;