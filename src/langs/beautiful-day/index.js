'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');
const cs = require('./ctors');

const defaultOpts = {
  gen: 0,
};

const run = (src, input, opts={}) => {
  opts = {...defaultOpts, ...opts};

  const system = parse(src.toString());
  const gen = system.createGenerator();

  for(const a of gen)
    log(a);

  O.exit();
};

const parse = src => {
  const tokens = O.match(src, /[^\\]|\\./gs);
  const rules = [];

  while(tokens.length !== 0){
    const semicolonIndex = tokens.indexOf(';');

    if(semicolonIndex === -1)
      esolangs.err(`Missing semicolon at the end of the last rule`);

    const ruleTokens = tokens.splice(0, semicolonIndex + 1);
    ruleTokens.pop();

    const ruleStr = ruleTokens.join('').trim();
    const ruleTokensFiltered = ruleTokens.filter(a => a.length === 2 || /^\S$/.test(a));
    const hyphenIndex = ruleTokensFiltered.indexOf('-');
    const lastHyphenIndex = ruleTokensFiltered.lastIndexOf('-');

    if(hyphenIndex === -1)
      esolangs.err(`Missing "-" in rule ${O.sf(ruleStr)}`);

    if(lastHyphenIndex !== hyphenIndex)
      esolangs.err(`Multiple "-" found in rule ${O.sf(rule)}`);

    const lhsTokens = ruleTokensFiltered.slice(0, hyphenIndex);
    const rhsTokens = ruleTokensFiltered.slice(hyphenIndex + 1);

    const lhsHashSignIndex = lhsTokens.indexOf('#');
    const hasHashSign = lhsHashSignIndex !== -1;

    if(hasHashSign && lhsHashSignIndex !== lhsTokens.length - 1)
      esolangs.err(`Character "#" can appear only at the end of the left-hand-side, ${
        ''}but it appears before the end in rule ${O.sf(ruleStr)}`);

    if(hasHashSign) lhsTokens.pop();

    const lhs = new cs.Lhs(
      lhsTokens.map(a => O.last(a)).join(''),
      hasHashSign,
    );

    const rhs = new cs.Rhs();
    const stack = [rhs];

    const addChar = char => {
      const group = O.last(stack);

      if(group.len === 0 || !(group.last instanceof cs.String)){
        group.add(new cs.String(char));
        return;
      }

      group.last.add(char);
    };

    for(const tk of rhsTokens){
      if(tk.length === 2){
        addChar(tk[1]);
        continue;
      }

      if(tk === '('){
        const group = new cs.Group();
        O.last(stack).add(group);
        stack.push(group);
        continue;
      }

      if(tk === ')'){
        if(stack.length === 1)
          esolangs.err(`Unmatched closed parenthese in rule ${O.sf(ruleStr)}`);

        stack.pop();
        continue;
      }

      if(tk === '.'){
        O.last(stack).add(new cs.Match());
        continue;
      }

      addChar(tk);
    }

    if(stack.length !== 1)
      esolangs.err(`Unmatched open parenthese in rule ${O.sf(ruleStr)}`);

    const rule = new cs.Rule(lhs, rhs);
    rules.push(rule);
  }

  return new cs.System(rules);
};

module.exports = run;