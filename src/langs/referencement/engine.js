'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

class Engine{
  constructor(parsed, input){
    this.parsed = parsed;
    this.input = input;
    this.output = null;
  }

  run(){
    const {parsed, input} = this;
    const io = new O.IO(input, 0, 1);

    let expr = parsed;

    expr.iter(expr => {
      if(expr.type !== 0) return;

      const ident = expr.name;
      let e = expr;

      while(1){
        e = e.parent;
        if(e === null) esolangs.err(`Identifier ${O.sf(ident)} is not bound to any abstraction`);
        if(e.type === 1 && e.ident === ident) break;
      }
    });

    [2, 3, 1, 1, 1].forEach((n, i) => {
      let func = new cs.NativeFunction(i);

      for(let i = 0; i !== n; i++)
        func = new cs.Invocation(func, new cs.Identifier(O.sfcc(i + 97)));

      for(let i = n - 1; i !== -1; i--)
        func = new cs.Abstraction(O.sfcc(i + 97), 1, func);

      expr = new cs.Invocation(expr, func);
    });

    const availX = expr => {
      const xx = O.obj();

      expr.iter(expr => {
        if(expr.type !== 1) return;
        if(expr.x === null) return;
        xx[expr.x] = 1;
      });

      for(let i = 0;; i++)
        if(!(i in xx)) return i;
    };

    const availY = expr => {
      const yy = O.obj();

      expr.iter(expr => {
        if(expr.type !== 1) return;
        if(expr.y === null) return;
        yy[expr.y] = 1;
      });

      for(let i = 0;; i++)
        if(!(i in yy)) return i;
    };

    const replace = (e1, e2) => {
      const {parent} = e1;
      if(parent !== null) parent.replace(e1, e2);
      else expr = e2;
      return parent;
    };

    while(expr.type === 2){
      log(expr.toString());

      let e = expr;

      while(1){
        while(e.expr1.type === 2) e = e.expr1;
        if(e.expr2.type === 1) break;
        e = e.expr2;
      }

      const {parent, expr1, expr2} = e;

      if(expr1.type === 1){
        expr1.x = null;
        expr1.y = null;

        if(expr2.x === null) expr2.x = availX(expr);
        if(!expr1.byRef) expr2.y = null;
        if(expr2.y === null) expr2.y = availY(expr);

        const {ident} = expr1;
        const e1 = expr1.expr;

        if(parent !== null){
          parent.replace(e, e1);
        }else{
          expr = e1;
          e1.parent = null;
        }

        e1.iter(expr => {
          if(expr.type === 1 && expr.ident === ident) return 0;
          if(expr.type !== 0 || expr.name !== ident) return;
          replace(expr, expr2.slice());
        });

        continue;
      }

      const {id} = expr1;

      if(id === 0){
        const e1 = expr2;
        const e2 = parent.expr2;
        const {y} = e1;

        replace(parent, e2);

        e1.iter(expr => {
          if(expr.type !== 1 || expr.y !== y) return;
          replace(expr, e2.slice());
        });

        continue;
      }

      if(id === 1){
        const p = parent.parent;
        const e1 = expr2;
        const e2 = parent.expr2;
        const e3 = p.expr2;

        replace(
          p, e1.x === e2.x ?
            new cs.Invocation(e3, e3.slice()) :
            e3
        );
        continue;
      }

      if(id === 2){
        replace(
          e, io.read() ?
            new cs.Invocation(expr2, expr2.slice()) :
            expr2
        );
        continue;
      }

      if(id === 3){
        io.write(0);
        replace(e, expr2);
        continue;
      }

      if(id === 4){
        io.write(1);
        replace(e, expr2);
        continue;
      }
    }

    log(expr.toString());

    this.output = io.getOutput();
  }
  
  getOutput(){
    return this.output;
  }
}

module.exports = Engine;