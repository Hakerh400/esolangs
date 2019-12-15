'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const reservedKws = [
  'input',
  'added',
  'subtracted',
];

class Engine{
  constructor(parsed, input){
    this.stats = parsed.stats;
    this.input = input.toString().split('');
    this.output = null;
  }

  run(){
    const {stats, input} = this;

    let output = '';

    const stack = stats.slice();
    const vars = O.obj();

    const assertType = (opName, val, types) => {
      const actual = typeof val;
      const ok = typeof types === 'string' ?
        actual === types :
        types.includes(actual);

      if(!ok) esolangs.err(`[${opName}] Expected a ${types[0]}, but got ${actual} ${O.sf(String(val))}`);
      return val;
    };

    const evalExpr = expr => {
      const stack1 = [];
      const stack2 = [[0, expr]];

      while(stack2.length !== 0){
        const [type, expr] = stack2.shift();
        const ctor = expr.constructor;
        const {name} = ctor;
        
        if(type === 0){
          if(expr instanceof cs.BinaryOperation){
            stack2.unshift(
              [0, expr.op1],
              [0, expr.op2],
              [1, expr],
            );
            continue;
          }

          if(expr instanceof cs.Identifier){
            const ident = expr.name;
            const str = ident.toLowerCase();

            if(str === 'input'){
              stack1.push(input.length !== 0 ? input.shift() : 0);
              continue;
            }

            if(str === 'added' || str === 'subtracted'){
              esolangs.err(`Illegal use of keyword ${O.sf(ident)}`);
              continue;
            }

            if(!(ident in vars)) esolangs.err(`Identifier ${O.sf(ident)} is not defined`);
            stack1.push(vars[ident]);
            continue;
          }

          if(expr instanceof cs.Literal){
            stack1.push(expr.val);
            continue;
          }

          O.noimpl(name);
        }

        let op1 = null;
        let op2 = null;

        if(expr instanceof cs.BinaryOperation){
          op2 = stack1.pop();
          op1 = stack1.pop();
        }

        switch(ctor){
          case cs.Addition: stack1.push(assertType(name, op1, ['bigint', 'string']) + assertType(name, op2, ['bigint', 'string'])); break;
          case cs.Subtraction: stack1.push(assertType(name, op1, 'bigint') - assertType(name, op2, 'bigint')); break;
          case cs.Equals: stack1.push(assertType(name, op1, ['bigint', 'string']) === assertType(name, op2, ['bigint', 'string'])); break;
          case cs.LessThan: stack1.push(assertType(name, op1, ['bigint', 'string']) < assertType(name, op2, ['bigint', 'string'])); break;
          case cs.GreaterThan: stack1.push(assertType(name, op1, ['bigint', 'string']) > assertType(name, op2, ['bigint', 'string'])); break;
          case cs.LessThanOrEqual: stack1.push(assertType(name, op1, ['bigint', 'string']) <= assertType(name, op2, ['bigint', 'string'])); break;
          case cs.GreaterThanOrEqual: stack1.push(assertType(name, op1, ['bigint', 'string']) >= assertType(name, op2, ['bigint', 'string'])); break;
          case cs.And: stack1.push(assertType(name, op1, 'boolean') && assertType(name, op2, 'boolean')); break;
          case cs.Or: stack1.push(assertType(name, op1, 'boolean') || assertType(name, op2, 'boolean')); break;

          default: O.noimpl(name); break;
        }
      }

      return stack1[0];
    };

    while(stack.length !== 0){
      const stat = stack.shift();
      const ctor = stat.constructor;
      const {name} = ctor;

      if(stat instanceof cs.Assignments){
        const {arr} = stat;
        for(let i = arr.length - 1; i !== -1; i--)
          stack.unshift(arr[i])
        continue;
      }

      if(stat instanceof cs.Assignment){
        const ident = stat.ident.name;
        const {expr} = stat;

        if(reservedKws.includes(ident.toLowerCase()))
          esolangs.err(`Reserved keyword ${O.sf(ident)} cannot be used as an identifier`);

        if(expr instanceof cs.Identifier){
          const name = expr.name.toLowerCase();

          if(name === 'added'){
            vars[ident]++;
            continue;
          }

          if(name === 'subtracted'){
            vars[ident]--;
            continue;
          }
        }

        const val = evalExpr(expr);
        vars[ident] = val;
        continue;
      }

      if(stat instanceof cs.If){
        const cond = assertType(name, evalExpr(stat.cond), 'boolean');
        if(cond) stack.unshift(stat.stat1);
        else if(stat.stat2 !== null) stack.unshift(stat.stat2);
        continue;
      }

      if(stat instanceof cs.For){
        if(!stat.initialized){
          stack.unshift(stat.stat1, stat);
          stat.initialized = 1;
          continue;
        }

        const cond = assertType(name, evalExpr(stat.cond), 'boolean');

        if(cond) stack.unshift(stat.stat3, stat.stat2, stat);
        else stat.initialized = 0;
        continue;
      }

      if(stat instanceof cs.Say){
        const val = evalExpr(stat.expr);
        output += val;
        continue;
      }

      O.noimpl(name);
    }

    this.output = Buffer.from(output);
  }
  
  getOutput(){
    return this.output;
  }
}

module.exports = Engine;