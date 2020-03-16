'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const VarSet = require('./var-set');

class Base extends O.Stringifiable{}

class Global extends Base{
  constructor(entsArr){
    super();

    this.entsArr = entsArr;
    const ents = this.ents = O.obj();

    for(const ent of entsArr){
      const {name} = ent;

      if(ent.name in ents)
        esolangs.err(`Redefinition of global ${ent.entType} ${O.sf(name)}`);

      ents[name] = ent;
      ent.globalEnts = ents;
    }
  }

  toStr(){
    const arr = [];
    this.join(arr, this.entsArr, '\n\n');
    return arr;
  }
}

class Type extends Base{
  constructor(ptrs){
    super();
    this.ptrs = ptrs;
  }

  static eq(t1, t2){ return t1.eq(t2); }
  static cmp(stack, t1, t2){ O.virtual('cmp', 1) }

  get pstr(){ return '*'.repeat(this.ptrs); }

  eq(type){
    const stack = [[this, type]];

    while(stack.length !== 0){
      const [t1, t2] = stack.pop();
      if(t1.ptrs !== t2.ptrs) return 0;

      const ctor = t1.constructor;
      if(t2.constructor !== ctor) return 0;

      if(!ctor.cmp(stack, t1, t2)) return 0;
    }

    return 1;
  }
}

class PrimitiveType extends Type{
  constructor(ptrs, name){
    super(ptrs);
    this.name = name;
  }

  static cmp(stack, t1, t2){
    return t1.name === t2.name;
  }

  toStr(){
    return `${this.name}${this.pstr}`;
  }
}

class FunctionType extends Type{
  constructor(ptrs, ret, args){
    super(ptrs);
    this.ret = ret;
    this.args = args;
  }

  static cmp(stack, t1, t2){
    const a1 = t1.args;
    const a2 = t2.args;
    if(a1.length !== a2.length) return 0;

    stack.push([t1.ret, t2.ret]);
    a1.forEach((a, i) => stack.push([a, a2[i]]));
    return 1;
  }

  toStr(){
    const arr = [`${this.ret}(${this.pstr})(`];

    this.args.forEach((a, i) => {
      if(i !== 0) arr.push('(');
      arr.push(a);
    });

    arr.push(')');

    return arr;
  }
}

class Statement extends Base{}

class EntityDef extends Statement{
  globalEnts = null;

  constructor(name, type){
    super();
    this.name = name.name;
    this.type = type;
  }

  get entType(){ O.virtual('entType'); }
};

class VariableDef extends EntityDef{
  constructor(name, type, expr){
    super(name, type);
    this.expr = expr !== null ? expr.sanitize() : null;
  }

  get entType(){ return 'variable'; }

  toStr(){
    const arr = [this.type, ' ', this.name];

    if(this.expr !== null)
      arr.push(' = ', this.expr);

    arr.push(';');

    return arr;
  }
}

class FunctionDef extends EntityDef{
  constructor(name, ret, args, body){
    super(name, new FunctionType(0, ret, args.map(a => a.type)));
    this.ret = ret;
    this.args = args;
    this.body = body;
    body.func = this;
  }

  get entType(){ return 'function'; }

  toStr(){
    const arr = [this.ret, ' ', this.name, '('];
    this.join(arr, this.args, ', ');
    arr.push(')', this.body);
    return arr;
  }
}

class FormalArgument extends Base{
  constructor(name, type){
    super();
    this.name = name.name;
    this.type = type;
  }

  toStr(){
    return [this.type, ' ', this.name];
  }
}

class CodeBlock extends Statement{
  func = null;
  parent = null;

  labelIndex = null;
  hasStartLabel = 0;
  hasEndLabel = 0;
  onEnd = null;

  constructor(stats){
    super();

    if(stats.length === 1 && stats[0] instanceof CodeBlock)
      stats = stats[0].stats;

    this.stats = stats;

    const vars = this.vars = new VarSet();

    for(const stat of stats){
      if(stat instanceof VariableDef){
        if(vars.has(stat.name))
          esolangs.err(`Redefinition of variable ${O.sf(stat.name)}`);

        vars.add(stat);
        continue;
      }

      if(stat instanceof CodeBlock){
        stat.parent = this;
        continue;
      }

      if(stat instanceof Control){
        stat.setParent(this);
        continue;
      }
    }

    this.varsArr = vars.toArr();
    this.varsMap = vars.toMap();
  }

  get varsNum(){ return this.varsArr.length; }

  getOffset(name){
    let block = this;

    while(1){
      const map = block.varsMap;

      if(!(name in map)){
        if(block.parent !== null){
          block = block.parent;
          continue;
        }

        const func = block.func;
        const index = func.args.findIndex(a => a.name === name);

        if(index === -1)
          esolangs.err(`Identifier ${O.sf(name)} is not defined`);

        return -(index + 2)
      }

      let offset = map[name];

      while(1){
        block = block.parent;
        if(block === null) return offset;

        offset += block.varsArr.length;
      }
    }
  }

  toStr(){
    const arr = [this.inc, '{\n'];
    this.join(arr, this.stats, '\n');
    arr.push(this.dec, '\n}');
    return arr;
  }
}

class Control extends Statement{
  setParent(){ O.virtual('setParent'); }
}

class If extends Control{
  constructor(cond, ifBlock, elseBlock){
    super();

    this.cond = cond;
    this.ifBlock = ifBlock;
    this.elseBlock = elseBlock;
  }

  setParent(block){
    this.ifBlock.parent = block;
    this.elseBlock.parent = block;
  }

  toStr(){
    const {ifBlock, elseBlock} = this;
    const stats1 = ifBlock.stats;
    const stats2 = elseBlock.stats;
    const arr = ['if(', this.cond, ')'];

    if(stats1.length === 1){
      arr.push(this.inc, '\n', stats1[0], this.dec);
    }else{
      arr.push(ifBlock);
    }

    if(stats2.length !== 0){
      if(stats1.length === 1)
        arr.push('\n');

      arr.push('else');

      if(stats2.length === 1){
        arr.push(this.inc, '\n', stats2[0], this.dec);
      }else{
        arr.push(elseBlock);
      }
    }

    return arr;
  }
}

class Return extends Statement{
  constructor(expr){
    super();
    this.expr = expr.sanitize();
  }

  toStr(){
    return ['return ', this.expr, ';'];
  }
}

class Asm extends Statement{
  constructor(insts){
    super();
    this.insts = insts;
  }

  toStr(){
    if(this.insts.length === 0)
      return 'asm{}';

    const arr = [this.inc, 'asm{\n'];

    this.join(arr, this.insts, '\n');
    arr.push(this.dec, '\n}');

    return arr;
  }
}

class ExpressionStatement extends Statement{
  constructor(expr){
    super();
    this.expr = expr.sanitize();
  }

  toStr(){
    return [this.expr, ';'];
  }
}

class Instruction extends Base{
  constructor(str){
    super();
    this.str = str;
  }

  toStr(){
    return [this.str, ';'];
  }
}

class Expression extends Base{
  type = null;
  lvalue = 0;

  sanitize(){
    this.topDown(expr => {
      if(expr.lvalue){
        if(expr instanceof Identifier)
          return;

        if(expr instanceof Dereference)
          return;

        esolangs.err(`Cannot interpret ${
          O.sf(expr)} as lvalue. Entire expression:\n\n${
          this}`);
      }

      if(expr instanceof TakeAddress){
        expr.op.lvalue = 1;
        return;
      }

      if(expr instanceof Assignment){
        expr.op1.lvalue = 1;
        return;
      }
    });

    return this;
  }
}

class Operation extends Expression{}

class UnaryOperation extends Operation{
  constructor(op){
    super();
    this.op = op;
  }

  iter(){
    return this.op;
  }
}

class UnaryPlus extends UnaryOperation{
  toStr(){
    const arr = ['+'];
    if(this.op instanceof UnaryPlus) arr.push(' ');
    arr.push(this.op);
    return arr;
  }
}

class UnaryMinus extends UnaryOperation{
  toStr(){
    const arr = ['-'];
    if(this.op instanceof UnaryMinus) arr.push(' ');
    arr.push(this.op);
    return arr;
  }
}

class TakeAddress extends UnaryOperation{
  toStr(){
    return ['&', this.op];
  }
}

class Dereference extends UnaryOperation{
  toStr(){
    return ['*', this.op];
  }
}

class BinaryOperation extends Operation{
  constructor(op1, op2){
    super();
    this.op1 = op1;
    this.op2 = op2;
  }

  iter(){
    return [this.op1, this.op2];
  }
}

class Assignment extends BinaryOperation{
  toStr(){
    return [this.op1, ' = ', this.op2];
  }
}

class Addition extends BinaryOperation{
  toStr(){
    return [this.op1, ' + ', this.op2];
  }
}

class Subtraction extends BinaryOperation{
  toStr(){
    return [this.op1, ' - ', this.op2];
  }
}

class Multiplication extends BinaryOperation{
  toStr(){
    return [this.op1, ' * ', this.op2];
  }
}

class Division extends BinaryOperation{
  toStr(){
    return [this.op1, ' / ', this.op2];
  }
}

class Modulo extends BinaryOperation{
  toStr(){
    return [this.op1, ' % ', this.op2];
  }
}

class Call extends Operation{
  constructor(func, args){
    super();
    this.func = func;
    this.args = args;
  }

  iter(){
    return [this.func, ...this.args];
  }

  toStr(){
    const arr = [this.func, '('];

    this.join(arr, this.args, ', ');
    arr.push(')');

    return arr;
  }
}

class Identifier extends Expression{
  constructor(name){
    super();
    this.name = name;
  }

  iter(){ return null; }

  toStr(){
    return this.name;
  }
}

class Literal extends Expression{
  iter(){ return null; }
}

class Number extends Literal{}

class Integer extends Number{
  constructor(val){
    super();
    this.val = val;
  }

  toStr(){
    return String(this.val);
  }
}

module.exports = {
  Base,
  Global,
  Type,
  PrimitiveType,
  FunctionType,
  Statement,
  EntityDef,
  VariableDef,
  FunctionDef,
  FormalArgument,
  CodeBlock,
  Control,
  If,
  Return,
  Asm,
  ExpressionStatement,
  Instruction,
  Expression,
  Operation,
  UnaryOperation,
  UnaryPlus,
  UnaryMinus,
  TakeAddress,
  Dereference,
  BinaryOperation,
  Assignment,
  Addition,
  Subtraction,
  Multiplication,
  Division,
  Modulo,
  Call,
  Identifier,
  Literal,
  Number,
  Integer,
};