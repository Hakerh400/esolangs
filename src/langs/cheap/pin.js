'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

class Pin{
  static INPUT = 0;
  static OUTPUT = 1;

  constructor(chip, elem, type, index){
    this.chip = chip;
    this.elem = elem;
    this.type = type;
    this.index = index;

    this.input = null;
    this.outputs = new Set();
  }

  static createInputArr(chip, elem, len){
    return Pin.createArr(chip, elem, len, Pin.INPUT);
  }

  static createOutputArr(chip, elem, len){
    return Pin.createArr(chip, elem, len, Pin.OUTPUT);
  }

  static createArr(chip, elem, len, type){
    return O.ca(len, i => {
      return new Pin(chip, elem, type, i);
    });
  }

  setElem(elem){
    this.elem = elem;
  }

  removeElem(){
    this.setElem(null);
  }

  setInput(input){
    if(this.input !== null)
      this.input.outputs.delete(this);

    this.input = input;

    if(input !== null)
      input.outputs.add(this);
  }

  removeInput(){
    this.setInput(null);
  }

  addOutput(output){
    output.setInput(this);
  }

  removeOutput(output){
    output.setInput(null);
  }

  hasOutput(output){
    this.outputs.has(output);
  }
}

module.exports = Pin;