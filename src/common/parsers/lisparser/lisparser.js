'use strict';

const assert = require('assert');
const O = require('omikron');
const esolangs = require('../../..');
const Specification = require('./specification');
const cs = require('./ctors');

class Lisparser{
  constructor(spec){
    if(typeof spec === 'string')
      spec = Specification.parse(spec);

    assert(spec instanceof Specification);

    this.spec = spec;
  }
}

module.exports = Lisparser;