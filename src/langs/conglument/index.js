'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');
const tk = require('./tokenizer');
const cs = require('./ctors');
const sf = require('./stack-frame');

const run = (src, input) => {
  let frame = new sf.Global(parse(src, input));
  let output = '';

  const set = func => {
    frame = frame.set(func);
  };

  const fail = () => {
    O.logb();
    log(frame.func.toString());
    O.logb();

    assert.fail();
  };

  while(1){
    const {func} = frame;

    if(func instanceof cs.Empty){
      assert(frame instanceof cs.Global);
      assert(func.nullary);
      break;
    }

    if(func instanceof cs.String){
      const {str} = func;

      if(str.length === 0){
        set(new cs.Empty(0));
        continue;
      }

      const c = new cs.Composition();
      c.push(new cs.Prefix(str[0] | 0));
      c.push(new cs.String(str.slice(1)));
      set(c);

      continue;
    }

    if(func instanceof cs.Composition){
      const {target, args} = func;

      if(target instanceof cs.Empty){
        set(new cs.Empty(func.arity));
        continue;
      }

      if(target instanceof cs.Prefix){
        if(frame instanceof sf.Global){
          output += target.bit;
          set(args[0]);
          continue;
        }

        // frame = frame.next;
        fail();

        continue;
      }

      if(target instanceof cs.Projection){
        set(args[target.index]);
        continue;
      }

      if(target instanceof cs.Composition){
        const {target: target1, args: args1} = target;
        const c = new cs.Composition();

        c.push(target1);

        for(const arg1 of args1){
          const c1 = new cs.Composition();

          c1.push(arg1);

          for(const arg of args)
            c1.push(arg);

          c.push(c1);
        }

        set(c);

        continue;
      }

      if(target instanceof cs.Recursion){
        const arg = args[0];

        if(arg instanceof cs.Empty){
          const f = target.empty;

          if(f.nullary){
            set(f);
            continue;
          }

          const c = new cs.Composition();

          c.push(f);

          args.forEach((arg, index) => {
            if(index === 0) return;
            c.push(arg);
          });

          set(c);

          continue;
        }

        if(arg instanceof cs.Prefix){
          assert.fail();
        }

        if(arg instanceof cs.Composition && arg.target instanceof cs.Prefix){
          const {bit} = arg.target;
          const c = new cs.Composition();
          const f = bit ? target.one : target.zero;
          const y = arg.args[0];

          c.push(f);
          c.push(y);

          const c1 = new cs.Composition();

          c1.push(target);
          c1.push(y);

          args.forEach((arg, index) => {
            if(index === 0) return;
            c1.push(arg);
          });

          c.push(c1);

          args.forEach((arg, index) => {
            if(index === 0) return;
            c.push(arg);
          });

          set(c);

          continue;
        }

        frame = new sf.CompositionArgument(frame, arg, 0);

        continue;
      }

      fail();
    }

    fail();
  }

  return Buffer.from(output);
};

const parse = (src, input) => {
  const tokenizer = new tk.Tokenizer(src);
  let prevIdent = 0;

  const mainComposition = new cs.Composition(1);
  const stack = [mainComposition];
  const scope = O.obj();

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
          err(`Empty string takes a number as argument`);

        push(new cs.Empty(num.val));
      } break;

      case tk.Plus: {
        const num = next();

        if(!(num instanceof tk.Number))
          err(`Prefix takes a number as argument`);

        const {val} = num;

        if(!(val === 0 || val === 1))
          err(`Argument of a prefix must be either 0 or 1`);

        push(new cs.Prefix(val));
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

      case tk.Tilde: {
        push(new cs.Composition());
      } break;

      case tk.Minus: {
        push(new cs.Recursion());
      } break;

      case tk.Star: {
        push(new cs.Minimization());
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

  if(!mainComposition.target.unary)
    esolangs.err(`The main function must be unary`);

  mainComposition.push(new cs.String(input));
  assert(mainComposition.nullary);

  return mainComposition;
};

module.exports = run;