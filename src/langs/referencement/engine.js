'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const DEBUG = 0;
const DEBUG_NATIVE_FUNCS = 0;

const DUMP_GLOBAL_EXPR = 0;
const DUMP_FILE = 'C:/Users/Thomas/Downloads/1.txt';

class Engine{
  constructor(parsed, input){
    this.parsed = parsed;
    this.input = input;
    this.output = null;
  }

  run(){
    const {parsed, input} = this;
    const io = new O.IO(input, 0, 1);

    let globalExpr = parsed;

    const avail = index => {
      const obj = O.obj();

      globalExpr.iter(expr => {
        if(expr.type !== 1) return;
        if(expr.params[index] === null) return;
        obj[expr.params[index]] = 1;
      });

      for(let i = 0;; i++)
        if(!(i in obj)) return i;
    };

    const replace = (e1, e2) => {
      const {parent} = e1;

      if(parent !== null){
        parent.replace(e1, e2);
      }else{
        globalExpr = e2;
        e2.parent = null;
      }

      return e2;
    };

    const logExpr = (expr=globalExpr) => {
      let str = expr.toString();

      if(str.length >= 200)
        str = `${str.slice(0, 196)}...`;

      log(str);
    };

    globalExpr.iter(expr => {
      if(expr instanceof cs.FancyFunction){
        const {args, exprs} = expr;
        const len = exprs.length;

        let e = O.last(exprs);

        if(len !== 1){
          let e1 = new cs.Identifier('#nop');

          for(let i = 0; i !== len - 1; i++)
            e1 = new cs.Invocation(e1, exprs[i]);

          e = new cs.Invocation(new cs.Invocation(new cs.Identifier('#0'), e1), e);
        }

        for(let i = args.length - 1; i !== -1; i--){
          const arg = args[i];
          e = new cs.Abstraction(arg.ident, arg.byRef, e);
          e.wasFancy = 1;
        }

        if(expr.parent === null){
          e = new cs.Invocation(e, new cs.Identifier('#assign'));

          e = new cs.Abstraction('#assign', 1, e);
          e = new cs.Abstraction('#0', 1, e);
          e = new cs.Abstraction('#nop', 1, e);

          e = new cs.Invocation(e,
            new cs.Invocation(
              new cs.Abstraction('a', 1, new cs.Invocation(new cs.Identifier('a'), new cs.Identifier('a'))),
              new cs.Abstraction('a', 1, new cs.Abstraction('b', 1, new cs.Invocation(new cs.Identifier('a'), new cs.Identifier('a')))),
            ),
          );

          e = new cs.Invocation(e,
            new cs.Abstraction('a', 1, new cs.Abstraction('b', 1, new cs.Identifier('b'))),
          );
        }

        return replace(expr, e);
      }

      if(expr instanceof cs.FancyCall){
        let e = expr.func;

        for(const arg of expr.args)
          e = new cs.Invocation(e, arg);

        return replace(expr, e);
      }

      if(expr instanceof cs.VarDeclaration){
        const exprNew = replace(expr, new cs.Invocation(
          new cs.Invocation(new cs.Identifier('#assign'), new cs.Identifier(expr.ident)),
          expr.expr,
        ));

        let e = exprNew;

        while(e.parent !== null && (e.parent.type !== 1 || !e.parent.wasFancy))
          e = e.parent;

        replace(e, new cs.Invocation(
          new cs.Abstraction(expr.ident, 0, e.shallowSlice()),
          new cs.Identifier('#0'),
        ));

        return exprNew;
      }

      if(expr instanceof cs.Assignment){
        return replace(expr, new cs.Invocation(
          new cs.Invocation(new cs.Identifier('#assign'), new cs.Identifier(expr.ident)),
          expr.expr,
        ));
      }
    });

    globalExpr.iter(expr => {
      if(expr.type !== 0) return;

      const ident = expr.name;
      let e = expr;

      while(1){
        e = e.parent;
        if(e === null) esolangs.err(`Identifier ${O.sf(ident)} is not bound to any abstraction`);
        if(e.type === 1 && e.ident === ident) break;
      }
    });

    [2, 3, 1, 1, 1].forEach((n, index) => {
      let func = new cs.NativeFunction(index);

      for(let i = 0; i !== n; i++)
        func = new cs.Invocation(func, new cs.Identifier(O.sfcc(i + 97)));

      for(let i = n - 1; i !== -1; i--)
        func = new cs.Abstraction(O.sfcc(i + 97), index !== 0 || i !== 1, func);

      globalExpr = new cs.Invocation(globalExpr, func);
    });

    if(DUMP_GLOBAL_EXPR)
      O.wfs(DUMP_FILE, globalExpr.toString());

    while(globalExpr.type === 2){
      let e = globalExpr;

      tco: if(e.type === 2){
        const e1 = e.expr1;
        if(e1.type !== 1) break tco;

        const e2 = e1.expr;
        if(e2.type !== 0) break tco;
        if(e2.name !== e1.ident) break tco;

        replace(globalExpr, e.expr2);
        continue;
      }

      while(1){
        while(e.expr1.type === 2) e = e.expr1;
        if(e.expr2.type === 1) break;
        e = e.expr2;
      }

      const {parent, expr1, expr2} = e;

      if(expr1.type === 1){
        if(DEBUG) logExpr(e);

        expr1.params[0] = null;
        expr1.params[1] = null;

        if(expr2.params[0] === null) expr2.params[0] = avail(0);
        if(!expr1.byRef) expr2.params[1] = null;
        if(expr2.params[1] === null) expr2.params[1] = avail(1);

        const {ident} = expr1;
        const e1 = expr1.expr;

        replace(e, e1);

        e1.iter(expr => {
          if(expr.type === 1 && expr.ident === ident) return 0;
          if(expr.type !== 0 || expr.name !== ident) return;

          replace(expr, expr2.slice());
        });

        continue;
      }

      const {id} = expr1;

      if(id === 0){
        if(DEBUG) logExpr(e.parent);
        if(DEBUG_NATIVE_FUNCS) log(`\n---> ASSIGN\n`);

        const e1 = expr2;
        const e2 = parent.expr2;
        const y = e1.params[1];

        const z = avail(2);
        const ident = new cs.Identifier(`{${z}}`);
        const recInv = new cs.Invocation(ident.slice(), ident.slice());
        const recFunc = new cs.Abstraction(ident.name, 1, recInv.slice());
        recFunc.params[2] = z;

        e2.iter(expr => {
          if(expr.type !== 1 || expr.params[1] !== y) return;

          replace(expr, recInv);
        });

        const func = new cs.Abstraction(ident.name, 1, e2);
        func.params[2] = z;

        const inv = new cs.Invocation(recFunc, func);
        replace(parent, inv);

        globalExpr.iter(expr => {
          if(expr === e2) return 0;
          if(expr.type !== 1 || expr.params[1] !== y) return;

          replace(expr, inv.slice());
        });

        continue;
      }

      if(id === 1){
        if(DEBUG) logExpr(e.parent.parent);
        if(DEBUG_NATIVE_FUNCS) log(`\n---> COMPARE\n`);

        const p = parent.parent;
        const e1 = expr2;
        const e2 = parent.expr2;
        const e3 = p.expr2;

        replace(p, e1.params[0] === e2.params[0] ? new cs.Invocation(e3, e3.slice()) : e3);

        continue;
      }

      if(id === 2){
        if(DEBUG) logExpr(e);
        if(DEBUG_NATIVE_FUNCS) log(`\n---> READ\n`);

        replace(e, io.read() ? new cs.Invocation(expr2, expr2.slice()) : expr2);

        continue;
      }

      if(id === 3){
        if(DEBUG) logExpr(e);
        if(DEBUG_NATIVE_FUNCS) log(`\n---> WRITE 0\n`);

        io.write(0);
        replace(e, expr2);

        continue;
      }

      if(id === 4){
        if(DEBUG) logExpr(e);
        if(DEBUG_NATIVE_FUNCS) log(`\n---> WRITE 1\n`);

        io.write(1);
        replace(e, expr2);

        continue;
      }
    }

    if(DEBUG) logExpr();

    this.output = io.getOutput();
  }
  
  getOutput(){
    return this.output;
  }
}

module.exports = Engine;