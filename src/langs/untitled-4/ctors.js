'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

class Base extends O.Stringifiable{}

class Prgram extends Base{
  constructor(cmds){
    super();
    this.cmds = cmds;
  }

  toStr(){
    return this.join([], this.cmds, '');
  }
}

class Command extends Base{
  constructor(name=null){
    super();

    this.name = name;
  }

  get isPassive(){ return 0; }
  get isActive(){ return 0; }
}

class PassiveCommand extends Command{
  get isPassive(){ return 1; }
}

class ClosedBracket extends PassiveCommand{
  toStr(){
    return ']';
  }
}

class Plus extends PassiveCommand{
  constructor(name){
    super(name);
  }

  toStr(){
    return `${this.name}+`;
  }
}

class Asterisk extends PassiveCommand{
  constructor(name, cmd){
    super(name);
    this.cmd = cmd;
  }

  toStr(){
    return [`${this.name}*`, this.cmd];
  }
}

class ActiveCommand extends Command{
  get isActive(){ return 1; }
}

class OpenBracket extends ActiveCommand{
  constructor(name){
    super(name);
  }

  toStr(){
    return `${this.name}[`;
  }
}

class EqualsSign extends ActiveCommand{
  constructor(name){
    super(name);
  }

  toStr(){
    return `${this.name}=`;
  }
}

class ExclamationMark extends ActiveCommand{
  constructor(name){
    super(name);
  }

  toStr(){
    return `${this.name}!`;
  }
}

module.exports = {
  Base,
  Prgram,
  Command,
  PassiveCommand,
  ClosedBracket,
  Plus,
  Asterisk,
  ActiveCommand,
  OpenBracket,
  EqualsSign,
  ExclamationMark,
};