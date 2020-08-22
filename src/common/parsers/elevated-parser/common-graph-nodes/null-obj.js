'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../omikron');
const SG = require('../serializable-graph');
const SF = require('../stack-frame');
const cgs = require('.');

class Null extends SG.Node{
  static #instances = new WeakMap();
  static #ctorSym = Symbol('constructor');

  constructor(g, ctorSym){
    super(g);
    if(g.dsr) return;

    if(ctorSym !== Null.#ctorSym)
      throw new TypeError('Null should not be instantiated explicitly');
  }

  static get(g){
    const insts = Null.#instances;

    if(!(insts.has(g) && g.has(insts.get(g))))
      insts.set(g, new Null(g, Null.#ctorSym));

    return insts.get(g);
  }
}

module.exports = Null;