'use strict';

const assert = require('assert');
const O = require('omikron');
const esolangs = require('../../..');
const cs = require('./ctors');

class Specification{
  static parse(str){
    const spec = new Specification();
    const {types} = spec;

    const extsMap = new Map();
    const specList = cs.ListElement.parse(str);

    for(const typeList of specList){
      assert(typeList instanceof cs.List);

      const {elems} = typeList;
      assert(elems[0] instanceof cs.Identifier);
      assert(elems[1] instanceof cs.Identifier);

      const elemType = elems[0].name;
      const elemName = elems[1].name;

      const type = new (
        elemType === 'def' ? cs.ConcreteType :
        elemType === 'abs' ? cs.AbstractType :
        assert.fail(elemType)
      )(elemName);

      assert(!(elemName in types));
      types[elemName] = type;

      const remaining = elems.slice(1);

      if(elemType === 'abs'){
        const exts = remaining.shift();
        assert(exts instanceof cs.List);

        const extsArr = [];
        extsMap.set(type, extsArr);

        for(const ext of exts){
          assert(ext instanceof cs.Identifier);
          extsArr.push(ext.name);
        }
      }

      for(const attrElem of remaining){
        assert(attrElem instanceof cs.List);

        const {elems} = attrElem;
        assert(elems.length === 3);
        assert(elems[0] instanceof cs.Identifier);
        assert(elems[1] instanceof cs.Identifier);
        assert(elems[2] instanceof cs.List);

        const attrType = elems[0].name;
        const attrName = elems[1].name;
        const valElem = elems[2];

        const attr = new (
          attrType === 'elem' ? cs.ElementAttribute :
          attrType === 'list' ? cs.ListAttribute :
          attrType === 'rest' ? cs.RestAttribute :
          assert.fail(attrType)
        )(attrName);

        log(valElem);

        const valElems = valElems.elems;
        assert(valElems[0] instanceof cs.Identifier);
      }
    }

    for(const typeName in types)
      types[type].assertNotCircular();

    return spec;
  }

  types = O.obj();
}

module.exports = Specification;