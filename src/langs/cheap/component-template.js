'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

class ComponentTemplate{
  constructor(inputPinsNum, outputPinsNum){
    this.inputPinsNum = inputPinsNum;
    this.outputPinsNum = outputPinsNum;

    this.internalInputPinsNum = outputPinsNum;
    this.internalOutputPinsNum = inputPinsNum;

    this.components = [];
    this.inputPins = [];

    this.references = new Set();
    this.referencedBy = new Set();
  }
}

module.exports = ComponentTemplate;