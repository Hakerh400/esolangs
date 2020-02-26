'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

const keywords = O.arr2obj([
  'void',
  'bool',
  'int',
  'if',
  'else',
  'for',
  'while',
  'return',
]);

class Base extends O.Stringifiable{}

class Program extends Base{
  constructor(funcsArr){
    super();

    this.funcsArr = funcsArr;
    const funcsObj = this.funcsObj = O.obj();

    // Add functions
    for(const func of funcsArr){
      const {name} = func;

      if(name in funcsObj)
        esolangs.err(`Redefinition of function ${
          O.sf(name)}\n\n${
          funcsObj[name]}\n\n${
          func}`);

      funcsObj[name] = func;
    }

    // Sanitize functions and expressions
    for(const func of funcsArr){
      const {args, body} = func;

      const err = msg => {
        esolangs.err(`${msg}\n\n${func}`);
      };

      for(const arg of args){
        if(arg.name in body.vars)
          err(`Duplicated argument ${O.sf(arg.name)}`);

        body.vars[arg.name] = arg;
      }

      const resolveIdent = name => {
        for(let i = stack.length - 1; i !== -1; i--){
          const scope = stack[i][0];

          if(name in scope.vars)
            return scope.vars[name];
        }

        if(name in funcsObj)
          return funcsObj[name];

        err(`Undefined variable ${O.sf(name)}`);
      };

      const sanitizeExpr = (expr, targetType) => {
        expr.bottomUp(expr => {
          switch(expr.constructor){
            case Identifier: {
              const ref = resolveIdent(expr.name);
              expr.ref = ref;

              if(ref instanceof VariableDefinition || ref instanceof FormalArgument){
                expr.type = ref.type;
                break;
              }

              if(ref instanceof FunctionDefinition){
                if(!ref.canBeUsedInExprs)
                  err(`Function ${
                    O.sf(ref.name)} cannot be used in expression ${
                    O.sf(expr)} (in the definition of function ${
                    O.sf(func.name)})`);

                expr.type = new Type('int', ref.type.ptrs + 1);
                break;
              }

              assert.fail();
            } break;

            case Integer: {
              expr.type = new Type('int');
            } break;

            default: assert.fail(); break;
          }
        });

        if(expr.type.neq(targetType))
          err(`Expression ${
            O.sf(expr)} evaluated to a value of type ${
            O.sf(expr.type)}, but it must be of type ${
            O.sf(targetType)} (in the definition of function ${
            O.sf(func.name)})`);
      };

      const stack = [[body, 0]];

      stackLoop: while(stack.length !== 0){
        const info = O.last(stack);
        const [scope, index] = info;
        const {stats, vars} = scope;

        for(let i = index; i !== stats.length; i++){
          const stat = stats[i];

          switch(stat.constructor){
            case VariableDefinition: {
              if(i === stats.length - 1)
                err(`Variable definition cannot be the last statement in a block`);

              if(stat.name in vars)
                err(`Redefinition of variable ${O.sf(stat.name)}`);

              sanitizeExpr(stat.expr, stat.type);
              vars[stat.name] = stat;
            } break;

            case CodeBlock: {
              info[1] = i + 1;
              stack.push([stat, 0]);
              continue stackLoop;
            } break;

            case Return: {
              if(i !== stats.length - 1)
                err(`Unreachable statements after return`);

              sanitizeExpr(stat.expr, func.type);
            } break;

            default: assert.fail(); break;
          }
        }

        stack.pop();
      }
    }
  }

  toStr(){
    return this.join([], this.funcsArr, '\n\n');
  }
}

class FunctionDefinition extends Base{
  constructor(type, name, args, body){
    super();

    this.type = type;
    this.name = name;
    this.args = args;
    this.body = body;
  }

  get canBeUsedInExprs(){
    const {args, type} = this;

    if(args.length !== 1) return 0;
    if(!args[0].type.eq(type)) return 0;
    if(type.name !== 'int') return 0;

    return 1;
  }

  toStr(){
    const arr = [this.type, ' ', this.name, '('];
    this.join(arr, this.args, ', ');
    arr.push(')', this.body);
    return arr;
  }
}

class FormalArgument extends Base{
  constructor(type, name){
    super();

    this.type = type;
    this.name = name;
  }

  toStr(){
    return [this.type, ' ', this.name];
  }
}

class Statement extends Base{}

class VariableDefinition extends Statement{
  constructor(type, name, expr){
    super();

    this.type = type;
    this.name = name;
    this.expr = expr;
  }

  toStr(){
    return [this.type, ' ', this.name, ' = ', this.expr, ';'];
  }
}

class Scope extends Statement{
  vars = O.obj();

  constructor(stats){
    super();

    this.stats = stats;
  }
}

class CodeBlock extends Scope{
  toStr(){
    if(this.stats.length === 0)
      return '{}';

    const arr = [this.inc, '{\n'];
    this.join(arr, this.stats, '\n');
    arr.push(this.dec, '\n}');
    return arr;
  }
}

class Return extends Statement{
  constructor(expr){
    super();

    this.expr = expr;
  }

  toStr(){
    return ['return ', this.expr, ';'];
  }
}

class Type extends Base{
  constructor(name, ptrs=0){
    super();

    this.name = name;
    this.ptrs = ptrs;

    if(ptrs !== 0){
      if(name !== 'int')
        esolangs.err(`Type ${
          O.sf(this)} is invalid, because only integers can have pointers`);
    }
  }

  eq(type){
    return this.name === type.name && this.ptrs === type.ptrs;
  }

  neq(type){
    return !this.eq(type);
  }

  toStr(){
    return [this.name, '*'.repeat(this.ptrs)];
  }
}

class Expression extends Base{
  type = null;
}

class Identifier extends Expression{
  ref = null;

  constructor(name){
    super();

    if(name in keywords)
      esolangs.err(`${O.sf(name)} is a reserved keyword`);

    this.name = name;
  }

  iter(){}

  toStr(){
    return this.name;
  }
}

class Literal extends Expression{}

class Integer extends Literal{
  constructor(val){
    super();

    this.val = val;
  }

  iter(){}

  toStr(){
    return String(this.val);
  }
}

module.exports = {
  Base,
  Program,
  FunctionDefinition,
  FormalArgument,
  Statement,
  VariableDefinition,
  CodeBlock,
  Return,
  Type,
  Expression,
  Identifier,
  Literal,
  Integer,
};