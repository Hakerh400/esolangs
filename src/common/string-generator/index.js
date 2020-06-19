'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../debug');
const cs = require('./ctors');

const stringGen = (rulesSrc, func=null) => {
  const system = parse(rulesSrc);
  const gen = system.createGenerator(func);

  return gen;
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
      esolangs.err(`Multiple "-" found in rule ${O.sf(ruleStr)}`);

    const lhsTokens = ruleTokensFiltered.slice(0, hyphenIndex);
    const rhsTokens = ruleTokensFiltered.slice(hyphenIndex + 1);

    if(lhsTokens.length === 0)
      esolangs.err(`Missing left-hand-side in rule ${O.sf(ruleStr)}`);

    if(rhsTokens.length === 0)
      esolangs.err(`Missing right-hand-side in rule ${O.sf(ruleStr)}`);

    let lhs, rhs;

    if(lhsTokens.includes('/')){
      if(lhsTokens.length !== 1)
        esolangs.err(`If character "/" appears on the left-hand-side, ${
          ''}it must be the only character there`);

      lhs = new cs.Lhs('', 0);
    }else{
      const lhsHashSignIndex = lhsTokens.indexOf('#');
      const hasHashSign = lhsHashSignIndex !== -1;

      if(hasHashSign && lhsHashSignIndex !== lhsTokens.length - 1)
        esolangs.err(`Character "#" can appear only at the end of the left-hand-side, ${
          ''}but it appears before the end in rule ${O.sf(ruleStr)}`);

      if(hasHashSign) lhsTokens.pop();

      lhs = new cs.Lhs(
        lhsTokens.map(a => O.last(a)).join(''),
        hasHashSign,
      );
    }

    if(rhsTokens.includes('/')){
      if(rhsTokens.length !== 1)
        esolangs.err(`If character "/" appears on the right-hand-side, ${
          ''}it must be the only character there`);

      rhs = new cs.Rhs();
    }else{
      rhs = new cs.Rhs();

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
    }

    const rule = new cs.Rule(lhs, rhs);
    rules.push(rule);
  }

  return new cs.System(rules);
};

module.exports = stringGen;