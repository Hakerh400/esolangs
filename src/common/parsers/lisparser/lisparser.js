'use strict';

const assert = require('assert');
const O = require('omikron');
const esolangs = require('../../..');
const cs = require('./ctors');

class Lisparser{
  static parseSpec(str){
    const ast = cs.ListElement.parse(str);

    return ast;
  }

  constructor(spec){
    if(typeof spec === 'string')
      spec = Lisparser.parseSpec(spec);

    assert(spec instanceof cs.ListElement);

    this.spec = spec;
  }
}

module.exports = Lisparser;