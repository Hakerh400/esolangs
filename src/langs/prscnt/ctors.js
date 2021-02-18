'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const Queue = require('./queue');

const DEBUG = 0;
const WARN_DEL_LAST_VAR = 0;

class Base extends O.Stringifiable{
  *copy(obj=O.obj()){ O.virtual('copy'); }
  *getVars(obj=O.obj()){ O.virtual('getVars'); }

  toStr(){
    return `[${this.constructor.name}]`;
  }
}

class Program extends Base{
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

  *initState(input){
    const varNames = O.keys(yield [[this, 'getVars']]);
    const varsObj = O.obj();

    for(const name of varNames)
      varsObj[name] = [0n];

    const io = new IO(input);
    return new State(this, 0, varsObj, io);
  }

  *initQueue(input){
    const state = yield [[this, 'initState'], input];
    return new Queue(state);
  }

  *getVars(obj=O.obj()){
    for(const cmd of this.cmds)
      yield [[cmd, 'getVars'], obj];

    return obj;
  }

  toStr(){
    return this.join([], this.cmds, '\n');
  }
}

class IO extends Base{
  #input;
  #output;

  constructor(input, output=[]){
    super();

    this.#input = [...input];
    this.#output = [...output];
  }

  read(){
    return BigInt(this.#input.shift() & 255);
  }

  write(byte){
    this.#output.push(Number(byte & 255n));
  }

  get output(){
    return Buffer.from(this.#output);
  }

  *copy(){
    return new IO(
      this.#input.slice(),
      this.#output.slice(),
    );
  }
}

class Monad extends Base{
  isState(){ return 0; }
  isTran(){ return 0; }
}

class State extends Monad{
  constructor(prog, ip, vars, io){
    super();

    this.prog = prog;
    this.ip = ip;
    this.vars = vars;
    this.io = io;
  }

  isState(){ return 1; }

  hasVar(name){
    return O.has(this.vars, name);
  }

  newVar(name){
    assert(this.hasVar(name));
    this.vars[name].push(0n);
  }

  delVar(name){
    assert(this.hasVar(name));

    const v = this.vars[name];

    if(v.length === 1){
      if(WARN_DEL_LAST_VAR)
        log(`Attempt to delete the last instance of variable ${
          O.sf(name)}`);

      return;
    }

    v.pop();
  }

  getVar(name){
    assert(this.hasVar(name));
    return O.last(this.vars[name]);
  }

  setVar(name, val){
    assert(this.hasVar(name));
    assert(typeof val === 'bigint');

    O.setLast(this.vars[name], val);
  }

  incVar(name){
    this.setVar(name, this.getVar(name) + 1n);
  }

  *copy(){
    const {prog, ip, vars, io} = this;
    const varsNew = O.obj();

    for(const v of O.keys(vars))
      varsNew[v] = vars[v].slice();

    const ioNew = yield [[io, 'copy']];

    return new State(prog, ip, varsNew, ioNew);
  }

  toStr(){
    const {vars} = this;
    const arr = ['State', this.inc, '\n'];

    arr.push('ip: ', String(this.ip), '\n');
    arr.push('vars', this.inc);

    for(const v of O.keys(vars))
      arr.push('\n', O.sf(v), ' ---> ', O.sfa(vars[v]));

    arr.push(this.dec);
    arr.push(this.dec);

    return arr;
  }
}

class Transition extends Monad{
  pri = 0;

  constructor(state){
    super();
    this.state = state;
  }

  isTran(){ return 1; }

  get prog(){ return this.state.prog; }

  *next(){ O.virtual('next'); }
}

class TransitionCmdSet extends Transition{
  constructor(state, varName){
    super(state);

    this.varName = varName;
    this.varVal = 0n;
  }

  *next(){
    const stateNew = yield [[this.state, 'copy']];
    stateNew.setVar(this.varName, this.varVal++);
    return stateNew;
  }
}

class TransitionCmdGso extends Transition{
  constructor(state){
    super(state);
    this.chkPtIndex = 0;
  }

  *next(){
    const {prog} = this;
    const {chkPts} = prog;

    if(this.chkPtIndex === chkPts.length)
      return null;

    const stateNew = yield [[this.state, 'copy']];
    stateNew.ip = chkPts[this.chkPtIndex++] + 1;

    return stateNew;
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

  get var(){
    assert(this.len === 1);
    return this.vars[0];
  }

  *getVars(obj=O.obj()){
    for(const v of this.vars)
      obj[v] = 1;

    return obj;
  }

  *exec(queue, state){ O.virtual('exec'); }

  toStr(){
    const arr = [this.name];

    this.vars.forEach((v, i) => {
      if(i !== 0) arr.push(',');
      arr.push(' ', v);
    });

    return arr;
  }
}

class Operation extends Command{
  get exactVarsNum(){ return 1; }
}

class CmdSet extends Operation{
  get name(){ return 'SET'; }

  *exec(queue, state){
    queue.push(new TransitionCmdSet(state, this.var));
  }
}

class CmdInc extends Operation{
  get name(){ return 'INC'; }

  *exec(queue, state){
    state.incVar(this.var);
    queue.push(state);
  }
}

class CmdNew extends Operation{
  get name(){ return 'NEW'; }

  *exec(queue, state){
    state.newVar(this.var);
    queue.push(state);
  }
}

class CmdDel extends Operation{
  get name(){ return 'DEL'; }

  *exec(queue, state){
    state.delVar(this.var);
    queue.push(state);
  }
}

class Assertion extends Command{
  get exactVarsNum(){ return 2; }
}

class CmdEqu extends Assertion{
  get name(){ return 'EQU' }

  *exec(queue, state){
    if(state.getVar(this.vars[0]) === state.getVar(this.vars[1]))
      queue.push(state);
  }
}

class CmdNeq extends Assertion{
  get name(){ return 'NEQ' }

  *exec(queue, state){
    if(state.getVar(this.vars[0]) !== state.getVar(this.vars[1]))
      queue.push(state);
  }
}

class Control extends Command{
  get exactVarsNum(){ return 0; }
}

class CmdGso extends Control{
  get name(){ return 'GSO' }

  *exec(queue, state){
    queue.push(new TransitionCmdGso(state));
  }
}

class CmdCfs extends Control{
  get name(){ return 'CFS' }

  *exec(queue, state){
    queue.push(state);
  }
}

class IOCmd extends Command{}

class CmdInp extends IOCmd{
  get name(){ return 'INP'; }

  *exec(queue, state){
    if(state.getVar(this.var) === state.io.read())
      queue.push(state);
  }
}

class CmdOut extends IOCmd{
  get name(){ return 'OUT'; }

  *exec(queue, state){
    state.io.write(state.getVar(this.var));
    queue.push(state);
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
  IO,
  Monad,
  State,
  Transition,
  TransitionCmdSet,
  TransitionCmdGso,
  Command,
  Operation,
  CmdSet,
  CmdInc,
  CmdNew,
  CmdDel,
  Assertion,
  CmdEqu,
  CmdNeq,
  Control,
  CmdGso,
  CmdCfs,
  IOCmd,
  CmdInp,
  CmdOut,
};