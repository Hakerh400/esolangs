'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const tokenizer = require('./tokenizer');
const cs = require('./ctors');

const {
  tokenize,
  tokTypes: tt,
  tok2str,
  toks2str,
  toksLen,
  err,
} = tokenizer;

const tilde = Symbol('~');

const parse = str => {
  const objIdentSym = O.obj();

  const hasIdent = ident => {
    return O.has(objIdentSym, ident);
  };

  const ident2sym = ident => {
    if(hasIdent(ident))
      return objIdentSym[ident];

    const sym = ident === '~' ? tilde : Symbol(ident);
    objIdentSym[ident] = sym;

    return sym;
  };

  const prog = new cs.Program(err);

  prog.addType(tilde);

  let currentType = null;
  let lastFunc = null;
  let lastArity = null;

  for(const info of tokenize(str)){
    const {line, toks, isLabel, popLevel} = info;

    const err = msg => {
      error(line, msg);
    };

    if(popLevel !== 0){
      assert(popLevel === 1);

      currentType = null;
      lastFunc = null;
    }

    const tlen = toksLen(toks);

    if(isLabel){
      // Type definition

      assert(O.last(toks) === tt.COLON);

      if(currentType !== null) err(`Nested type definitions are not allowed`);
      if(tlen !== 2 || toks[0] !== tt.TYPE) err(`Invalid type definition`);

      const typeIdent = toks[1];
      const type = ident2sym(typeIdent);

      if(prog.hasType(type)) err(`Redefinition of type ${O.sf(typeIdent)}`);
      prog.addType(type);

      currentType = type;
      lastFunc = null;

      continue;
    }

    // Function definition

    if(toks[0] !== tt.VAR) err(`Function name must start with a lowercase letter`);

    const funcIdent = toks[1];
    const func = ident2sym(funcIdent);

    if(prog.hasFunc(func) && func !== lastFunc)
      err(`All case definitions of function ${O.sf(funcIdent)} must be continuous`);

    if(!prog.hasFunc(func)){
      const sym = func;

      {
        const func = new cs.Function(sym, currentType)
        prog.addFunc(sym, func);
      }
    }else{
      assert(prog.hasCases(func));
    }

    if(func !== lastFunc)
      lastArity = null;

    lastFunc = func;

    const eqIndex = toks.indexOf(tt.EQ);
    const eqIndexLast = toks.lastIndexOf(tt.EQ);

    if(eqIndex === -1) err(`Missing equals sign`);
    if(eqIndexLast !== eqIndex) err(`Multiple equals signs`);

    const lhsToks = toks.slice(2, eqIndex);
    const rhsToks = toks.slice(eqIndex + 1);

    const parseLhs = function*(toks){
      const toksNum = toks.length;
      let index = 0;

      const next = (advance=1) => {
        if(eof()) err(`Expected a token, but found the end of the statement`);

        const tok = toks[index];
        if(advance) index++;

        return tok;
      };

      const eof = () => {
        return index === toksNum;
      };

      const parseArgs = function*(){
        const args = [];

        while(!eof())
          args.push(yield [parseAsPat]);

        return args;
      };

      const parseExpr = function*(){
        let expr = yield [parseAsPat];

        while(!eof()){
          const tok = next(0);

          if(tok === tt.CLOSED_PAREN)
            break;

          const asPat = yield [parseAsPat];
          expr = new cs.Pair(expr, asPat);
        }

        return expr;
      };

      const parseAsPat = function*(){
        const exprs = [yield [parseTerm]];

        while(!eof()){
          const tok = next(0);

          if(tok !== tt.COLON)
            break;

          next();

          const term = yield [parseTerm];
          exprs.push(term);
        }

        if(exprs.length === 1)
          return exprs[0];

        return new cs.AsPattern(exprs);
      };

      const parseTerm = function*(){
        const tok = next();

        if(tok === tt.TYPE){
          const sym = ident2sym(next());

          if(sym === tilde)
            return new cs.Pair(new cs.Type(sym), yield [parseTerm]);

          return new cs.Type(sym);
        }

        if(tok === tt.VAR)
          return new cs.Variable(ident2sym(next()));

        if(tok === tt.OPEN_PAREN){
          const expr = yield [parseExpr];
          if(next() !== tt.CLOSED_PAREN) err(`Missing closed parenthese`);
          return expr;
        }

        if(tok === tt.STAR)
          return cs.anyExpr;

        err(`Unexpected token ${O.sf(tok2str(tok))}`);
      };

      const args = O.rec(parseArgs);
      if(!eof()) err(`Extra tokens found on the LHS`);

      return new cs.Lhs(args);
    };

    const parseRhs = function*(toks){
      const toksNum = toks.length;
      let index = 0;

      const next = (advance=1) => {
        if(eof()) err(`Expected a token, but found the end of the statement`);

        const tok = toks[index];
        if(advance) index++;

        return tok;
      };

      const eof = () => {
        return index === toksNum;
      };

      const parseExpr = function*(){
        let expr = yield [parseTerm];

        while(!eof()){
          const tok = next(0);

          if(tok === tt.CLOSED_PAREN)
            break;

          const term = yield [parseTerm];
          expr = new cs.Call(expr, term);
        }

        return expr;
      };

      const parseTerm = function*(){
        const tok = next();

        if(tok === tt.TYPE){
          const sym = ident2sym(next());

          if(sym === tilde)
            return new cs.Call(new cs.Type(sym), yield [parseTerm]);

          return new cs.Type(sym);
        }

        if(tok === tt.VAR)
          return new cs.Variable(ident2sym(next()));

        if(tok === tt.OPEN_PAREN){
          const expr = yield [parseExpr];
          if(next() !== tt.CLOSED_PAREN) err(`Missing closed parenthese`);
          return expr;
        }

        err(`Unexpected token ${O.sf(tok2str(tok))}`);
      };

      const expr = O.rec(parseExpr);
      if(!eof()) err(`Extra tokens found on the RHS`);

      return new cs.Rhs(expr);
    };

    const lhs = O.rec(parseLhs, lhsToks);
    const rhs = O.rec(parseRhs, rhsToks);

    const {args, arity} = lhs;
    const {result} = rhs;

    if(lastArity !== null && arity !== lastArity)
      err(`Case definitions of function ${
        O.sf(funcIdent)} differ in the number of arguments (${
        lastArity} vs ${arity})`);

    lastArity = arity;

    const fcase = new cs.FunctionCase(lhs, rhs);
    prog.addCase(func, fcase);
  }

  return prog.sanitize();
};

const error = (line, msg) => {
  assert(typeof line === 'string');
  assert(typeof msg === 'string');

  err(`${msg}\n\n${line}`);
};

module.exports = {
  parse,
  tilde,
};