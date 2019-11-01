'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../omikron');
const SG = require('../../serializable-graph');
const SF = require('../stack-frame');
const cgs = require('.');

class Undefined extends SG.Node{
  static #instances = new WeakMap();
  static #ctorSym = Symbol('constructor');

  constructor(g, ctorSym){
    super(g);
    if(g.dsr) return;

    if(ctorSym !== Undefined.#ctorSym)
      throw new TypeError('Undefined should not be instantiated explicitly');
  }

  static get(g){
    const insts = Undefined.#instances;

    if(!(insts.has(g) && g.has(insts.get(g))))
      insts.set(g, new Undefined(g, Undefined.#ctorSym));

    return insts.get(g);
  }
}

module.exports = Undefined;