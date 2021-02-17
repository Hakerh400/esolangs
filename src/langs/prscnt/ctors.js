'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const Sym2str = require('../../common/sym2str');

class Base extends O.Stringifiable{}

class Program extends Base{
  sym(){ return Symbol(); }
  sym2str = Sym2str();

  cmds = [];
  chkPts = [];

  constructor(cmds=[]){
    super();
    this.addCmds(cmds);
  }

  get len(){
    return this.cmds.length;
  }

  addCmds(cmds){
    for(const cmd of cmds)
      this.addCmd(cmd);

    return this;
  }

  addCmd(cmd){
    const {cmds} = this;

    if(cmd.name === 'CFS')
      this.chkPts.push(cmds.length);

    cmds.push(cmd);
    return this;
  }

  toStr(){
    return this.join([], this.cmds, '\n');
  }
}

class Command extends Base{
  constructor(vars){
    super();

    const {exactVarsNum} = this;
    const len = vars.length;

    if(exactVarsNum !== null && len !== exactVarsNum)
      esolangs.err(`Command ${
        O.sf(this.name)} takes exactly ${
        exactVarsNum} arguments, but it is supplied with ${
        len}`);

    this.vars = vars;
  }

  get len(){ return this.vars.length; }
  get name(){ O.virtual('name'); }
  get exactVarsNum(){ return null; }

  toStr(){
    const arr = [this.name];

    this.vars.forEach((v, i) => {
      if(i !== 0) arr.push(',');
      arr.push(' ', v);
    });

    return arr;
  }
}

class NullaryCmd extends Command{
  get exactVarsNum(){ return 0; }
}

class BinaryCmd extends Command{
  get exactVarsNum(){ return 2; }
}

class Operation extends Command{}

class CmdSet extends Operation{
  get name(){ return 'SET'; }
}

class CmdInc extends Operation{
  get name(){ return 'INC'; }
}

class CmdNew extends Operation{
  get name(){ return 'NEW'; }
}

class CmdDel extends Operation{
  get name(){ return 'DEL'; }
}

class Assertion extends BinaryCmd{}

class CmdEqu extends Assertion{
  get name(){ return 'EQU' }
}

class CmdNeq extends Assertion{
  get name(){ return 'NEQ' }
}

class Control extends NullaryCmd{}

class CmdGso extends Control{
  get name(){ return 'GSO' }
}

class CmdCfs extends Control{
  get name(){ return 'CFS' }
}

class IO extends Command{}

class CmdInp extends IO{
  get name(){ return 'INP'; }
}

class CmdOut extends IO{
  get name(){ return 'OUT'; }
}

class Value extends Base{
  constructor(base, terms){
    super();
    this.base = base;
    this.terms = terms;
  }

  get isConst(){ return this.terms.length === 0; }

  get isValid(){
    if(this.base >= 0) return 1;
    return this.terms.some(term => term.nneg);
  }

  toStr(){
    const {terms} = this;
    const len = terms.length;
    const arr = [];

    for(let i = 0; i !== len; i++){
      const term = terms[i];
      const {str} = term;
    }
  }
}

class Term extends Base{
  constructor(sym, fac){
    super();

    assert(fac !== 0);

    this.sym = sym;
    this.fac = fac;
  }

  get sgn(){ return Math.sign(this.fac); }
  get isNeg(){ return this.fac.isNeg; }

  toStr(){
    return [this.fac, sym2str(this.sym)];
  }
}

class Factor extends Base{
  constructor(rat){
    super();
    this.rat = rat;
  }

  get isNeg(){ return this.rat.isNeg; }

  toStr(){
    const {rat} = this;

    if(rat.isInt)
      return String(rat.a);

    return `${rat.a}/${rat.b}`;
  }
}

const cmdsArr = [
  CmdSet,
  CmdInc,
  CmdNew,
  CmdDel,
  CmdEqu,
  CmdNeq,
  CmdGso,
  CmdCfs,
  CmdInp,
  CmdOut,
];

const cmdsObj = O.obj();

for(const cmd of cmdsArr)
  cmdsObj[cmd.prototype.name] = cmd;

module.exports = {
  cmds: cmdsObj,

  Base,
  Program,
  Command,
  Value,
  Term,
  Factor,
};