'use strict';

const assert = require('assert');
const O = require('omikron');
const esolangs = require('../../..');
const cs = require('./ctors');

class Specification{
  static parse(str){
    const spec = new Specification();
    const {types} = spec;

    const specList = cs.ListElement.parse(str);

    for(const typeList of specList){
      assert(typeList instanceof cs.List);
      assert(!typeList.isEmpty);

      const {elems} = typeList;
      assert(elems[0] instanceof cs.Identifier);

      if(elems[0].name === 'def'){
        continue;
      }

      if(elems[0].name === 'abs'){
        continue;
      }

      assert.fail(elems[0].name);
    }

    return spec;
  }

  types = O.obj();
}

module.exports = Specification;