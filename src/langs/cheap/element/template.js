'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const Pin = require('../pin');
const Element = require('./element');
const Gate = require('./gate');

const {GateNot, GateOr} = Gate;

class Template extends Element{
  #outputs;
  #inputs;

  constructor(chip, inputsNum, outputsNum){
    super(chip, inputsNum, outputsNum);

    this.elems = [];
    this.#outputs = this.inputs.slice();
    this.#inputs = this.outputs.slice();

    this.refs = new Set();
  }

  static createInitials(chip){
    return [
      Template.createGateNot(chip),
      Template.createGateOr(chip),
      Template.createMain(chip),
    ];
  }

  static createMain(chip){
    return new Template(chip, 1, 3);
  }

  static createGateNot(chip){
    return Template.fromGate(new GateNot(chip));
  }

  static createGateOr(chip){
    return Template.fromGate(new GateOr(chip));
  }

  static fromGate(gate){
    const {chip, inputsNum, outputsNum} = gate;

    const template = new Template(chip, inputsNum, outputsNum);
    template.addElem(gate);

    for(const output of template.outputs)
      output.addOutput(gate.inputs[output.index]);

    for(const output of gate.outputs)
      output.addOutput(template.inputs[output.index]);

    return template;
  }

  addElem(elem){
    this.elems.push(elem);

    for(const pin of elem.inputs)
      this.inputs.push(pin);

    for(const pin of elem.outputs)
      this.inputs.push(pin);

    if(elem.isComponent)
      this.refs.add(elem.template);
  }

  hasRef(template){
    return this.refs.has(template);
  }

  get isTemplate(){ return 1; }
}

module.exports = Template;