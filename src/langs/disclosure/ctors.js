'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const VarSet = require('./var-set');

class Base extends O.Stringifiable{}

class Global extends Base{
  constructor(globalEnts){
    super();

    this.globalEnts = globalEnts;
    const ents = this.ents = O.obj();

    for(const ent of globalEnts){
      const {name} = ent;

      if(ent.name in ents)
        esolangs.err(`Redefinition of global ${ent.entType} ${O.sf(name)}`);

      ents[name] = ent;
      ent.globalEnts = ents;
    }
  }

  toStr(){
    const arr = [];
    this.join(arr, this.globalEnts, '\n\n');
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
  constructor(name, type, val){
    super(name, type);
    this.val = val;
  }

  get entType(){ return 'variable'; }

  toStr(){
    return [this.type, ' ', this.name, ' = ', this.val, ';'];
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
}

class CodeBlock extends Statement{
  func = null;
  parent = null;

  labelIndex = null;
  hasStartLabel = 0;
  hasEndLabel = 0;
  onEnd = null;

  start = 1;

  constructor(stats){
    super();

    this.stats = stats;

    const vars = this.vars = new VarSet();

    for(const stat of stats){
      if(stat instanceof VariableDef){
        if(vars.has(stat.name))
          esolangs.err(`Duplicate definition of variable ${O.sf(stat.name)}`);

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

        return -3 - index;
      }

      let offset = map[name];

      while(1){
        block = block.parent;
        if(block === null) return offset;

        offset += block.varsArr.length;
        block  =block.parent;
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
}

class Return extends Statement{
  constructor(val){
    super();
    this.val = val;
  }
}

class Value extends Base{
  type = null;
}

class Operation extends Value{}

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

class Assignment extends BinaryOperation{}
class Addition extends BinaryOperation{}
class Subtraction extends BinaryOperation{}
class Multiplication extends BinaryOperation{}
class Division extends BinaryOperation{}
class Modulo extends BinaryOperation{}

class Call extends Operation{
  constructor(func, args){
    super();
    this.func = func;
    this.args = args;
  }

  iter(){
    return [this.func, ...this.args];
  }
}

class Identifier extends Value{
  constructor(name){
    super();
    this.name = name;
  }

  iter(){ return null; }

  toStr(){
    return this.name;
  }
}

class Literal extends Value{
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
  Value,
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