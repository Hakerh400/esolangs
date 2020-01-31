'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const Element = require('./element');

class Component extends Element{
  constructor(chip, template){
    super(chip, template.inputsNum, template.outputsNum);
    this.template = template;
  }

  get isComponent(){ return 1; }
}

module.exports = Component;