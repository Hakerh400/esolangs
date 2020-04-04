'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
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
    const {parsed: system, input} = this;

    const e1 = system.rules[0].conclusion;
    let e2;

    {
      const map = new Map();
      let last;

      e1.bottomUp(expr => {
        const {name} = expr;
        const args = expr.args.map(a => map.get(a) || a);

        const exprNew = name !== 'f' ?
          new cs.Expression(name, args) :
          new cs.Expression('A', [
            new cs.Expression('g1', args),
            new cs.Expression('g2', args),
          ]);

        map.set(expr, exprNew);
        last = exprNew;
      });

      e2 = last;
    }

    log(e1.toString());
    log(e2.toString());

    O.exit();

    this.output = Buffer.from(output);
  }
  
  getOutput(){
    return this.output;
  }
}

module.exports = Engine;