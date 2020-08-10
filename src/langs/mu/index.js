'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');

const TAB_SIZE = 2;
const TAB = ' '.repeat(TAB_SIZE);

const types = O.enum([
  'NUMBER',
  'IDENTIFIER',
  'FUNCTOR',
  'COMBINATOR',
  'GLOBAL',
]);

const run = (src, input) => {
  const func = parse(src.toString());
  const output = [];
  const stack = [[func, output, [input]]];

  while(output.length !== 1){
    const last = O.last(stack);
    const [func, args1, args2] = last;
    const [tkType, type] = func;

    if(tkType === types.GLOBAL){
      call(func[3][0], [args2[0]]);
      continue;
    }

    if(tkType === types.FUNCTOR){
      if(type === 0){
        stack.pop();
        O.last(stack)[1].push('');
        continue;
      }

      if(type === 1){
        stack.pop();
        O.last(stack)[1].push(`${func[2]}${args2[0]}`);
        continue;
      }

      assert.fail(type);
    }

    if(tkType === types.COMBINATOR){
      const info = func[3];
      continue;
    }

    assert.fail(tkType);
  }

  return Buffer.from(output[0]);
};

const parse = src => {
  const kIdents = Symbol('idents');
  let srcIndex = 0;

  const err = (ctx, msg) => {
    esolangs.err(`Error while parsing [${ctx.toLowerCase()}]:\n${TAB}${msg}`);
  };

  const errt = (ctx, tk) => {
    err(ctx, `Unexpected token ${O.sf(tk)}`);
  };

  const assertNeof = ctx => {
    if(srcIndex === src.length)
      err(ctx, `Unexpected end of the source code`);
  };

  const read = ctx => {
    assertNeof(ctx);

    return src[srcIndex++];
  };

  const readS = ctx => {
    while(1){
      const char = read(ctx);
      if(/\S/.test(char)) return char;
    }
  };

  const token = (ctx, expectNumber=0) => {
    const index = srcIndex;
    const char = readS(ctx);

    const numOrIdent = strOrig => {
      if(!expectNumber)
        return [types.IDENTIFIER, strOrig];

      let str = strOrig;

      if(str.length !== 1){
        if(str[0] === '\\') str = str.slice(1);
        else str = str.slice(1, str.length - 1);
      }

      if(!/^(?:0|[1-9][0-9]*)$/.test(str))
        esolangs.err(`Invalid number ${O.sf(strOrig)}`);

      const num = Number(str);

      if(num > Number.MAX_SAFE_INTEGER)
        esolangs.err(`Too large number ${O.sf(strOrig)}`);

      return [types.NUMBER, num];
    };

    if(/[a-zA-Z0-9]/.test(char))
      return numOrIdent(char);

    if(char === '\\'){
      const ctxNew = `${ctx} identifier`;
      return numOrIdent(`\\${read(ctxNew)}${read(ctxNew)}`);
    }

    if(char === '('){
      const ctxNew = `${ctx} identifier`;
      let str = char;
      let depth = 1;

      while(1){
        const char = read(ctxNew);

        str += char

        if(char === '(') depth++;
        else if(char === ')' && --depth === 0) break;
      }

      return numOrIdent(str);
    }

    if(char === '.'){
      const ctxNew = `${ctx} .`;
      const a = number(ctxNew);

      return initIdents([types.FUNCTOR, 0, a]);
    }

    if(char === '+'){
      const ctxNew = `${ctx} .`;
      const a = number(ctxNew);

      if(a > 1)
        esolangs.err(`Argument of + can be either 0 or 1`);

      return initIdents([types.FUNCTOR, 1, String(a)]);
    }

    if(char === '%'){
      const ctxNew = `${ctx} .`;
      const a = number(ctxNew);
      const b = number(ctxNew);

      if(b >= a)
        esolangs.err(`The first argument of % must be larger than the second argument`);

      return initIdents([types.FUNCTOR, 2, a, b]);
    }

    const comb = '~-*'.indexOf(char);
    if(comb !== -1) return initIdents([types.COMBINATOR, comb, null, []]);

    errt(ctx, char);
  };

  const number = ctx => {
    return token(ctx, 1)[1];
  };

  const computedArity = (info, index) => {
    assert(index < info.length);

    const num = info[index][2];
    assert(typeof num === 'number');

    return num;
  };

  const getArity = func => {
    const [tkType, type] = func;

    if(tkType === types.GLOBAL) return 1;

    if(tkType === types.FUNCTOR){
      if(type === 0) return func[2];
      if(type === 1) return 1;
      if(type === 2) return func[2];

      assert.fail(type);
    }

    if(tkType === types.COMBINATOR){
      if(func[2] !== null) return func[2];

      const info = func[3];
      const len = info.length;
      let num = null;

      calcArity: {
        if(type === 0){
          if(len >= 2) num = computedArity(info, 1);
          break calcArity;
        }

        if(type === 1){
          if(len !== 0) num = computedArity(info, 0) + 1;
          break calcArity;
        }

        if(type === 2){
          if(len !== 0) num = computedArity(info, 0) - 1;
          break calcArity;
        }
        
        assert.fail(type);
      }

      return func[2] = num;
    }

    assert.fail(tkType);
  };

  const nextArity = func => {
    const [tkType, type] = func;

    assert(!isFull(func));

    if(tkType === types.GLOBAL) return 1;

    if(tkType === types.COMBINATOR){
      const info = func[3];
      const len = info.length;

      if(type === 0){
        if(len < 2) return null;
        return computedArity(info, 1);
      }

      if(type === 1){
        if(len === 0) return null;
        return computedArity(info, 0) + 2;
      }

      if(type === 2){
        if(len === 0) return null;
        const num = computedArity(info, 0);
        assert(num !== 0);
        return num - 1;
      }

      assert.fail(type);
    }

    assert.fail(tkType);
  };

  const isFull = func => {
    const [tkType, type] = func;

    if(tkType === types.GLOBAL) return func[3].length === 1;
    if(tkType === types.FUNCTOR) return 1;

    if(tkType === types.COMBINATOR){
      const info = func[3];
      const len = info.length;

      if(type === 0){
        if(len === 0) return 0;
        return len === computedArity(info, 0) + 1;
      }

      if(type === 1) return len === 3;
      if(type === 2) return len === 1;
      
      assert.fail(type);
    }

    assert.fail(tkType);
  };

  const initIdents = func => {
    return Object.defineProperty(func, kIdents, {
      value: null,
      writable: 1,
      configurable: 1,
    });
  };

  const hasIdents = func => {
    return Array.isArray(func[kIdents]);
  };

  const clearIdents = func => {
    assert(hasIdents(func));
    func[kIdents] = null;
  };

  const setIdents = (func, idents) => {
    assert(func[kIdents] === null);
    func[kIdents] = idents;
  };

  const getIdents = func => {
    assert(hasIdents(func));
    return func[kIdents];
  };

  const scope = O.obj();
  const globalInfo = [];
  const stack = [[types.GLOBAL, null, null, globalInfo]];
  const idents = [];

  const push = func => {
    setIdents(func, idents.slice());
    idents.length = 0;

    stack.push(func);

    while(1){
      const func = O.last(stack);
      if(!isFull(func)) break;
      if(stack.length === 1) break;

      pop();

      const last = O.last(stack);
      const expectedArity = nextArity(last);
      const actualArity = getArity(func);

      assert(actualArity !== null);

      if(expectedArity !== null && actualArity !== expectedArity)
        esolangs.err(`Expected arity ${expectedArity}, but got ${actualArity} in the context ${
          `[${types[last[0]]}${stack.length !== 1 ? ` ${last[1]}` : ''}]:[${types[func[0]]} ${func[1]}]`.toLowerCase()}`);

      last[3].push(func);
    }
  };

  const pop = () => {
    const func = stack.pop();
    assert(isFull(func));

    const idents = getIdents(func);
    clearIdents(func);

    for(const ident of idents)
      scope[ident] = func;

    return func;
  };

  while(globalInfo.length !== 1){
    const last = O.last(stack);
    const ctx = types[last[0]];
    const tk = token(ctx);

    const tkType = tk[0];

    if(tkType === types.IDENTIFIER){
      const name = tk[1];

      if(name in scope){
        push(scope[name]);
        continue;
      }

      idents.push(name);
      continue;
    }

    if(tkType === types.FUNCTOR || tkType === types.COMBINATOR){
      push(tk);
      continue;
    }

    assert.fail(tkType);
  }

  if(srcIndex !== src.length){
    const rest = src.slice(srcIndex).trimLeft();

    if(rest.length !== 0)
      esolangs.err(`Extra tokens found at the end of the source code near ${
        O.sf(rest.slice(0, 100).trim())}`);
  }

  return stack[0];
};

module.exports = run;