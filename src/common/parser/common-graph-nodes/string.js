'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../omikron');
const SG = require('../../serializable-graph');
const SF = require('../stack-frame');
const cgs = require('.');

class String extends SG.Node{
  #str = '';

  constructor(g, str=''){
    super(g);
    if(g.dsr) return;

    this.str = str;
  }

  ser(s){ super.ser(s); s.writeStr(this.#str); }
  deser(s){ super.deser(s); this.str = s.readStr(); }

  get str(){ return this.#str; }
  set str(str){ this[SG.sizeSym] -= this.#str.length - (this.#str = str).length | 0; }
  get length(){ return this.str.length; }

  eq(str){ return this.str === str.str; }
  neq(str){ return this.str !== str.str; }

  toString(){ return this.#str; }
}

module.exports = String;