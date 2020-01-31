'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const Pin = require('../pin');

class Element{
  constructor(chip, inputsNum, outputsNum){
    this.chip = chip;
    this.inputsNum = inputsNum;
    this.outputsNum = outputsNum;

    this.inputs = Pin.createInputArr(chip, this, inputsNum);
    this.outputs = Pin.createInputArr(chip, this, outputsNum);
  }

  get isGate(){ return 0; }
  get isTemplate(){ return 0; }
  get isComponent(){ return 0; }
}

module.exports = Element;