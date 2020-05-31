'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../../..');
const cs = require('.');

const {Base} = cs;

class State extends Base{
  constructor(system, transition, targets, equations){
    super();

    this.system = system;
    this.transition = transition;
    this.targets = targets;
    this.equations = equations;

    this.id = system.createSymbol();
  }

  toStr(){
    return [
      'State ', this.id, ':', this.inc, '\n',
      'transition: ', this.transition !== null ? this.transition : '/', '\n',
      'targets: ', this.targets, '\n',
      'equations: ', this.equations, this.dec, '\n',
    ];
  }
}

class Transition extends Base{
  constructor(from){
    super();

    this.from = from;
  }
}

const ctors = {
  State,
};

Object.assign(cs, ctors);
module.exports = cs;