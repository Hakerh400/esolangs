'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const VarSet = require('./var-set');

class Base{}

class Global extends Base{
  constructor(globalEnts){
    super();

    const ents = this.ents = O.obj();

    for(const ent of globalEnts){
      const {name} = ent;

      if(ent.name in ents)
        esolangs.err(`Redefinition of global ${ent.entType} ${O.sf(name)}`);

      ents[name] = ent;
      ent.globalEnts = ents;
    }
  }
}

class Type extends Base{
  constructor(name, ptrs){
    super();
    this.name = name;
    this.ptrs = ptrs;
  }

  eq(type){
    return type.name === this.name && type.ptrs === this.ptrs;
  }
}

class Statement{}

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
}

class FunctionDef extends EntityDef{
  constructor(name, type, args, body){
    super(name, type);
    this.args = args;
    this.body = body;

    body.func = this;
  }

  get entType(){ return 'function'; }
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

class BinaryOperation extends Value{}

class Addition extends BinaryOperation{
  constructor(op1, op2){
    super();
    this.op1 = op1;
    this.op2 = op2;
  }
}

class Subtraction extends BinaryOperation{
  constructor(op1, op2){
    super();
    this.op1 = op1;
    this.op2 = op2;
  }
}

class Multiplication extends BinaryOperation{
  constructor(op1, op2){
    super();
    this.op1 = op1;
    this.op2 = op2;
  }
}

class Division extends BinaryOperation{
  constructor(op1, op2){
    super();
    this.op1 = op1;
    this.op2 = op2;
  }
}

class Modulo extends BinaryOperation{
  constructor(op1, op2){
    super();
    this.op1 = op1;
    this.op2 = op2;
  }
}

class Call extends Operation{
  constructor(func, args){
    super();
    this.func = func;
    this.args = args;
  }
}

class Identifier extends Value{
  constructor(name){
    super();
    this.name = name;
  }
}

class Literal extends Value{}

class Number extends Literal{}

class Integer extends Number{
  constructor(val){
    super();
    this.val = val;
  }
}

module.exports = {
  Base,
  Global,
  Type,
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
  BinaryOperation,
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