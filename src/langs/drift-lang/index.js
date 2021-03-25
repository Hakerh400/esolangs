'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const parser = require('./parser');
const Database = require('./database');
const Info = require('./info');
const cs = require('./ctors');

const {tilde} = parser;
const {isSym, isPair} = Database;

const MAIN_FUNC_NAME = 'main';

const cwd = __dirname;
const headerFile = path.join(cwd, 'header.txt');

let header = null;

const run = async (src, input) => {
  const header = await getHeader();
  const srcNew = `${header}\n${src.toString().trim()}`;
  const prog = parser.parse(srcNew);
  const db = new Database();

  const reduceIdent = function*(ident){
    const sym = prog.ident2sym(ident);
    return O.tco(reduceExpr, sym);
  };

  const reduceExpr = function*(expr){
    const info = db.getInfo(expr);
    return O.tco(reduce, info);
  };

  const reduce = function*(info){
    if(info.reducedTo !== null)
      return info.reducedTo;

    const {baseSym} = info;

    if(prog.hasType(baseSym))
      return db.reduceToItself(info);

    const func = prog.getFunc(baseSym);
    const funcType = func.type;
    const {arity} = func;
    const args = getArgsFromInfo(info);
    const argsNum = args.length;

    assert(argsNum <= arity);

    if(argsNum < arity)
      return db.reduceToItself(info);

    const err = msg => {
      error(`${msg}\n\n${O.rec(info2str, info)}`);
    };

    const {cases} = func;
    const casesNum = cases.length;

    tryCase: for(let i = 0; i !== casesNum; i++){
      const fcase = cases[i];

      const {lhs, rhs} = fcase;
      const lhsArg = lhs.args;
      const rhsExpr = rhs.expr;

      const vars = O.obj();
      const refs = O.obj();

      const errCtx = msg => {
        const ctxInfo = O.keys(vars).map(sym => {
          return `${sym.description}: ${O.rec(info2str, vars[sym])}`;
        });

        const ctxStr = ctxInfo.length !== 0 ? `\n\n${ctxInfo.join('\n')}` : '';

        error(`${msg}\n\n${O.rec(info2str, info)}${ctxStr}`);
      };

      const match = function*(formal, actual, escaped=0){
        if(formal instanceof cs.Type){
          const info = yield [reduceExpr, formal.sym];
          return info === actual;
        }
        
        if(formal instanceof cs.Variable){
          const {sym} = formal;

          if(!escaped) refs[sym] = 1;

          if(!O.has(vars, sym)){
            vars[sym] = actual;
            return 1;
          }

          return vars[sym] === actual;
        }

        if(formal instanceof cs.Pair){
          const {expr} = actual;
          if(isSym(expr)) return 0;

          const [fst, snd] = expr;
          const sndEscaped = fst.baseSym === tilde && fst.argsNum === 0;

          return (
            (yield [match, formal.fst, fst, 1]) &&
            (yield [match, formal.snd, snd, sndEscaped])
          );
        }

        if(formal instanceof cs.AsPattern){
          for(const expr of formal.exprs)
            if(!(yield [match, expr, actual, escaped]))
              return 0;

          return 1;
        }

        if(formal instanceof cs.AnyExpression)
          return 1;

        assert.fail(formal.constructor.name);
      };

      const simplify = function*(expr, escaped=0){
        if(expr instanceof cs.NamedExpression){
          const {sym} = expr;

          const illegalConstructor = (
            !escaped &&
            expr instanceof cs.Type &&
            prog.hasType(sym) &&
            sym !== funcType &&
            sym !== tilde
          );

          if(illegalConstructor)
            err(`Function ${
              O.sf(func.sym.description)} is not allowed to explicitly contruct type ${
              O.sf(sym.description)}`);

          if(O.has(vars, sym)){
            if(!escaped && !O.has(refs, sym))
              errCtx(`Variable ${
                O.sf(sym.description)} from case ${
                i + 1} of function ${
                O.sf(func.sym.description)} cannot be referenced in this context`);

            return vars[sym];
          }

          return O.tco(reduceExpr, sym);
        }

        if(expr instanceof cs.Call){
          const fst = yield [simplify, expr.fst, 0];
          const sndEscaped = fst.baseSym === tilde && fst.argsNum === 0;
          const snd = yield [simplify, expr.snd, sndEscaped];
          const info = db.getInfo([fst, snd]);

          return O.tco(reduce, info);
        }

        assert.fail(expr.constructor.name);
      };

      for(let j = 0; j !== arity; j++){
        const formal = lhsArg[j];
        const actual = args[j];

        if(!(yield [match, formal, actual]))
          continue tryCase;
      }

      const reduced = yield [simplify, rhsExpr];
      
      return db.reduce(info, reduced);
    }

    err(`Non-exhaustive patterns in function ${O.sf(baseSym.description)}`);
  };

  const info2str = function*(info, parens=0){
    const {expr} = info;

    if(isSym(expr))
      return expr.description;

    const str = `${
      yield [info2str, expr[0], 0]} ${
      yield [info2str, expr[1], 1]}`;

    if(parens) return `(${str})`;
    return str;
  };

  const tt = O.rec(reduceExpr, tilde);
  const Bit = O.rec(reduceIdent, 'Bit');
  const Bit0 = O.rec(reduceIdent, 'Bit0');
  const Bit1 = O.rec(reduceIdent, 'Bit1');
  const BBit0 = O.rec(reduceExpr, [Bit, Bit0]);
  const BBit1 = O.rec(reduceExpr, [Bit, Bit1]);
  const List = O.rec(reduceIdent, 'List');
  const Nil = O.rec(reduceIdent, 'Nil');
  const Cons = O.rec(reduceIdent, 'Cons');
  const tBit = O.rec(reduceExpr, [tt, Bit]);
  const tList = O.rec(reduceExpr, [List, tBit]);
  const tNil = O.rec(reduceExpr, [Nil, tBit]);
  const tCons = O.rec(reduceExpr, [Cons, tBit]);
  const tCons0 = O.rec(reduceExpr, [tCons, BBit0]);
  const tCons1 = O.rec(reduceExpr, [tCons, BBit1]);

  const bits2expr = bits => {
    let list = tNil;

    for(let i = bits.length - 1; i !== -1; i--){
      const cons = bits[i] === 0x30 ? tCons0 : tCons1;
      list = O.rec(reduceExpr, [cons, list]);
    }

    return O.rec(reduceExpr, [tList, list]);
  };

  const expr2bits = list => {
    const {expr} = list;

    if(!(isPair(expr) && expr[0] === tList))
      esolangs.err(`Output must be of type "List ~Bit"\n\n${
        O.rec(info2str, list)}`);

    const bits = [];
    let info = expr[1];

    while(info !== tNil){
      const {expr} = info;
      const bit = expr[0] === tCons0 ? 0x30 : 0x31;

      bits.push(bit);
      info = expr[1];
    }

    return Buffer.from(bits);
  };

  if(!prog.hasIdent(MAIN_FUNC_NAME))
    esolangs.err(`Missing definition for function ${O.sf(MAIN_FUNC_NAME)}`)

  const mainFuncSym = prog.ident2sym(MAIN_FUNC_NAME);

  if(prog.hasType(mainFuncSym))
    esolangs.err(`${O.sf(MAIN_FUNC_NAME)} must be a function, not a type`);

  const mainExpr = O.rec(reduceExpr, mainFuncSym);
  const inputExpr = bits2expr(input);
  const outputExpr = O.rec(reduceExpr, [mainExpr, inputExpr]);

  return expr2bits(outputExpr);
};

const getArgsFromInfo = info => {
  const args = [];
  let expr = info.expr;

  while(isPair(expr)){
    const [fst, snd] = expr;

    args.push(snd);
    expr = fst.expr;
  }

  return args.reverse();
};

const getHeader = async () => {
  if(header === null)
    header = await O.rfs(headerFile, 1);

  return header;
};

const error = msg => {
  esolangs.err(msg);
};

module.exports = run;