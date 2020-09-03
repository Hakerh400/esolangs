'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const tk = require('./tokenizer');
const cs = require('./ctors');
const sf = require('./stack-frame');

const parse = (src, input) => {
  const tokenizer = new tk.Tokenizer(src);
  let prevIdent = 0;

  const mainComposition = new cs.Composition(null);
  const stack = [mainComposition];
  const scopes = [O.obj()];

  const err = msg => {
    esolangs.err(`${msg} (near ${O.sf(tokenizer.srcPrev.slice(0, 100))})`);
  };

  const next = () => {
    return tokenizer.next();
  };

  const push = func => {
    assert(func instanceof cs.Function);
    assert(stack.length !== 0);

    const scope = O.last(scopes);

    stack.push(func);

    while(1){
      const func = O.last(stack);
      if(!func.full) break;

      stack.pop();

      while(1){
        const elem = O.last(stack);
        if(!(elem instanceof tk.Identifier)) break;

        stack.pop();
        scope[elem.name] = func;
      }

      const last = O.last(stack);

      if(last instanceof tk.OpenParenthese){
        stack.push(func);
        break;
      }

      assert(last instanceof cs.Function, last);

      if(last === mainComposition && !func.unary)
        esolangs.err(`The main function must be unary`);

      if(last.full){
        assert(stack.length >= 2);
        assert(stack[stack.length - 2] instanceof tk.OpenParenthese);

        err(`Parenthesis can only contain a single full function`);
      }

      const errMsg = last.push(func, 1);
      if(errMsg) err(errMsg);
    }
  };

  tokLoop: while(mainComposition.target === null){
    const tok = next();
    const ctor = tok.constructor;

    switch(ctor){
      case tk.Dot: {
        const num = next();

        if(!(num instanceof tk.Number))
          err(`Empty string function takes a number as argument`);

        push(new cs.Empty(num.val));
      } break;

      case tk.Plus: {
        const num = next();

        if(!(num instanceof tk.Number))
          err(`Prefix takes a number as argument`);

        const {val} = num;

        if(!(val === 0 || val === 1))
          err(`Argument of a prefix must be either 0 or 1`);

        push(cs.Prefix.get(val));
      } break;

      case tk.Percent: {
        const num1 = next();
        const num2 = !(num1 instanceof tk.Eof) ? next() : null;

        const ok = (
          num1 instanceof tk.Number &&
          num2 instanceof tk.Number
        );

        if(!ok) err(`Projection takes two numbers as arguments`);

        const {val: val1} = num1;
        const {val: val2} = num2;

        if(val2 >= val1)
          err(`The second argument of a projection must be strictly smaller than the first argument`);

        push(new cs.Projection(val1, val2));
      } break;

      case tk.Tilde: {
        let explicitArity = null;

        const tok = next();

        if(tok instanceof tk.Eof)
          esolangs.err(`Missing arguments for composition (at the end of the source code)`);

        if(tok instanceof tk.Number){
          explicitArity = tok.val;
        }else{
          tokenizer.src = tokenizer.srcPrev;
        }

        push(new cs.Composition(explicitArity));
      } break;

      case tk.Minus: {
        push(new cs.Recursion());
      } break;

      case tk.Star: {
        push(new cs.Minimization());
      } break;

      case tk.OpenParenthese: {
        stack.push(tok);
        scopes.push(O.obj());
      } break;

      case tk.ClosedParenthese: {
        if(scopes.length === 1)
          err(`Missing open parenthese`);

        if(O.last(stack) instanceof tk.OpenParenthese)
          err(`Parenthesis cannot be empty`);

        assert(scopes.length > 1);
        scopes.pop();

        assert(stack.length > 1);
        const func = stack.pop();

        if(func instanceof tk.Identifier)
          err(`Missing definition for identifier ${O.sf(func.name)}`);

        assert(func instanceof cs.Function);

        if(O.last(stack !== tk.OpenParenthese) || !func.full)
          err(`Unfinished function in parenthesis`);

        stack.pop();
        push(func);

      } break;

      case tk.Identifier: case tk.Number: {
        const scope = O.last(scopes);
        const {name} = tok;

        prevIdent = 1;

        if(name in scope){
          push(scope[name]);
          continue tokLoop;
        }

        stack.push(tok);
        continue tokLoop;
      } break;

      case tk.Eof: {
        esolangs.err(`Unexpected end of the source code`);
      } break;

      default: {
        assert.fail(ctor.name);
      } break;
    }

    prevIdent = 0;
  }

  if(scopes.length !== 1)
    esolangs.err(`Missing closed parenthese`);

  if(!(next() instanceof tk.Eof))
    err(`Extra tokens found at the end of the source code`);

  assert(mainComposition.target.unary);

  mainComposition.push(new cs.String(input));
  assert(mainComposition.nullary);

  return mainComposition;
};

module.exports = {
  parse,
};