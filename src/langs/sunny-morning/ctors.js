'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

class Base extends O.Stringifiable{
  toJSON(){
    return this.toString();
  }
}

class Program extends Base{
  constructor(defsArr){
    super();

    if(defsArr.length === 0)
      esolangs.err(`Source code must contain at least one definition`);

    this.defsArr = defsArr;
    this.mainDef = defsArr[0].op;

    const defs = O.obj();

    for(const def of defsArr){
      const {name} = def;

      if(name in defs)
        esolangs.err(`Redefinition of ${
          O.sf(name)}:\n\n${
          defs[name]}\n${def}`);

      defs[name] = def.op;
    }

    for(const def of defsArr){
      const {op} = def;

      for(const name of op.opsNames){
        if(!(name in defs))
          esolangs.err(`Missing definition for ${
            O.sf(name)}. Relevant context:\n\n${def}`);

        op.ops.push(defs[name]);
      }
    }
  }

  toStr(){
    return this.join([], this.defsArr, '\n');
  }
}

class Definition extends Base{
  constructor(name, op){
    super();
    this.name = name;
    this.op = op;
    // op.name = name;
  }

  toStr(){
    return this.join([], [this.name, this.op], ' ');
  }
}

class Operation extends Base{
  ops = [];

  get isCt(){ return 0; }
  get isExt(){ return 0; }
  get isCond(){ return 0; }
  get isInv(){ return 0; }

  get opStr(){ O.virtual('opStr'); }

  toStr(){
    return `${this.opStr} ${this.opsNames.join(' ')}`;
    // return this.name;
  }
}

class Construct extends Operation{
  constructor(bit, op1, op2){
    super();
    this.bit = bit;
    this.opsNames = [op1, op2];
  }

  get isCt(){ return 1; }
  get opStr(){ return String(this.bit); }
}

class Extract extends Operation{
  constructor(type, op1){
    super();
    this.type = type;
    this.op1 = op1;
    this.opsNames = [op1];
  }

  get isExt(){ return 1; }
  get opStr(){ return this.type === 0 ? '<' : '>'; }
}

class Conditional extends Operation{
  get isCond(){ return 1; }
  get type(){ O.virtual('type'); }
}

class Conditional1 extends Conditional{
  constructor(op1, op2){
    super();
    this.opsNames = [op1, op2];
  }

  get opStr(){ return '?'; }
  get type(){ return 0; }
}

class Conditional2 extends Conditional{
  constructor(op1, op2, op3){
    super();
    this.opsNames = [op1, op2, op3];
  }

  get opStr(){ return '*'; }
  get type(){ return 1; }
}

class Invocation extends Operation{
  constructor(op1, op2){
    super();
    this.opsNames = [op1, op2];
  }

  get isInv(){ return 1; }
  get opStr(){ return '.'; }
}

module.exports = {
  Base,
  Program,
  Definition,
  Operation,
  Construct,
  Extract,
  Conditional,
  Conditional1,
  Conditional2,
  Invocation,
};