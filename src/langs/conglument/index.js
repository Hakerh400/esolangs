'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');
const tk = require('./tokenizer');
const cs = require('./ctors');

const run = (src, input) => {
  const tokenizer = new tk.Tokenizer(src);
  let prevIdent = 0;

  const mainComposition = new cs.Composition(); // The main composition
  const stack = [mainComposition]; // Contains incomplete functions
  const scope = O.obj(); // Map from identifiers to functions

  const err = msg => {
    esolangs.err(`${msg} (near ${O.sf(tokenizer.srcPrev.slice(0, 100))})`);
  };

  const next = () => {
    return tokenizer.next();
  };

  const push = func => {
    assert(func instanceof cs.Function);
    assert(stack.length !== 0);

    stack.push(func);

    while(1){
      const func = O.last(stack);
      if(!func.full) break;

      stack.pop();

      while(1){
        const ident = O.last(stack);
        if(!(ident instanceof tk.Identifier)) break;

        stack.pop();
        scope[ident.name] = func;
      }

      O.last(stack).push(func);
    }
  };

  tokLoop: while(mainComposition.target === null){
    const tok = next();
    const ctor = tok.constructor;

    switch(ctor){
      case tk.Dot: {
        const num = next();

        if(!(num instanceof tk.Number))
          err(`Empty function takes a number as argument`);

        push(new cs.Empty(num.val));
      } break;

      case tk.Plus: {
        const num = next();

        if(!(num instanceof tk.Number))
          err(`Successor takes a number as argument`);

        const {val} = num;

        if(!(val === 0 || val === 1))
          err(`Argument of a successor must be either 0 or 1`);

        push(new cs.Successor(val));
      } break;

      case tk.Percent: {
        const num1 = next();
        const pipe = next();
        const num2 = next();

        const ok = (
          num1 instanceof tk.Number &&
          pipe instanceof tk.Pipe &&
          num2 instanceof tk.Number
        );

        if(!ok)
          err(`Projection takes two numbers as arguments separated by a pipe character`);

        const {val: val1} = num1;
        const {val: val2} = num2;

        if(val2 >= val1)
          err(`The second argument of a projection must be strictly smaller than the first argument`);

        push(new cs.Projection(val1, val2));
      } break;

      case tk.Number: {
        err(`Stray number ${tok.val}`);
      } break;

      case tk.Identifier: {
        const {name} = tok;

        prevIdent = 1;

        if(name in scope){
          push(scope[name]);
          continue tokLoop;
        }

        stack.push(tok);
        continue tokLoop;
      } break;

      case tk.Pipe: {
        if(!prevIdent)
          err(`Stray pipe character`);
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

  if(!(next() instanceof tk.Eof))
    err(`Extra tokens found at the end of the source code`);

  if(mainComposition.target.arity !== 1)
    esolangs.err(`The main function must be unary`);

  // Transform the input into a function
  {
    let func = new cs.Empty(0);

    for(const bit of input){
      const c = new cs.Composition();
      c.push(new cs.Successor(bit | 0));
      c.push(func);
      func = c;
    }

    mainComposition.push(func);
  }

  log(mainComposition.toString());

  O.exit();
};

module.exports = run;