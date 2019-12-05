'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const VarSet = require('./var-set');

class Base{}

class Script extends Base{
  constructor(globalEnts){
    super();

    const ents = this.ents = O.obj();

    for(const ent of globalEnts){
      const {name} = ent;

      if(ent.name in ents)
        throw new TypeError(`Redefinition of global ${ent.entType} ${O.sf(name)}`);

      ents[name] = ent;
    }
  }
}

class Type extends Base{
  constructor(name, ptrs){
    super();
    this.name = name;
    this.ptrs = ptrs;
  }
}

class EntityDef extends Base{
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
  }

  get entType(){ return 'function'; }
}

class Argument extends Base{
  constructor(name, type){
    super();
    this.name = name.name;
    this.type = type;
  }
}

class CodeBlock extends Base{
  constructor(stats){
    super();

    this.stats = stats;

    const vars = this.vars = new VarSet();

    for(const stat of stats){
      if(stat instanceof VariableDef)
        vars.add(stat);
    }

    this.varsArr = [...vars];
  }
}

class Operation extends Base{}

class Addition extends Operation{
  constructor(op1, op2){
    super();
    this.op1 = op1;
    this.op2 = op2;
  }
}

class Subtraction extends Operation{
  constructor(op1, op2){
    super();
    this.op1 = op1;
    this.op2 = op2;
  }
}

class Identifier extends Base{
  constructor(name){
    super();
    this.name = name;
  }
}

class Literal extends Base{}

class Number extends Literal{}

class Integer extends Number{
  constructor(val){
    super();
    this.val = val;
  }
}

module.exports = {
  Base,
  Script,
  Type,
  EntityDef,
  VariableDef,
  FunctionDef,
  Argument,
  CodeBlock,
  Operation,
  Addition,
  Subtraction,
  Identifier,
  Literal,
  Number,
  Integer,
};