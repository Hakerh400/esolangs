'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const List = require('@hakerh400/list');
const esolangs = require('../..');
const debug = require('../debug');

const {ArrayList} = List;

class Base extends O.Stringifiable{}

class System extends Base{
  constructor(rules){
    super();
    this.rules = rules;
  }

  *createGenerator(func=null){
    const {rules} = this;
    const seen = new Set();
    const queue = new ArrayList([['', new Group([new Group()])]]);
    let queueLen = 1;

    while(queueLen !== 0){
      const state = queue.shift();
      const [stateStr, stateGroup] = state;

      queueLen--;

      let group = stateGroup.es[0];
      assert(stateGroup.len >= 1);
      assert(group instanceof Group);

      while(1){
        const {es} = group;
        const groupIndex = es.findIndex(a => a instanceof Group);
        if(groupIndex === -1) break;

        group = es[groupIndex];
      }

      const {es} = group;
      const len = es.length;
      const hasStr = len !== 0 && es[0] instanceof String;
      const str = hasStr ? es[0].str : '';
      const end = len === (hasStr ? 1 : 0);

      for(const rule of rules){
        const {lhs, rhs} = rule;
        const lhsStr = lhs.str.str;

        if(!end && lhs.end) continue;
        if(lhs.end ? str !== lhsStr : !str.startsWith(lhsStr)) continue;

        const rest = new ElementsArray();
        rest.add(new String(str.slice(lhsStr.length)));

        for(let i = hasStr ? 1 : 0; i !== len; i++)
          rest.add(es[i]);

        const groupNew = stateGroup.replace(group, rhs.parametrize(rest));
        const esNew = groupNew.es;
        let strNew = stateStr;

        if(esNew.length !== 0 && esNew[0] instanceof String){
          strNew += esNew[0].str;
          esNew.shift();
        }

        if(esNew.length === 0){
          if(seen.has(strNew)) continue;

          seen.add(strNew);
          yield strNew;

          continue;
        }

        if(func && !func(strNew)){
          continue;
        }

        queue.push([strNew, groupNew]);
        queueLen++;
      }
    }
  }

  toStr(){
    return this.join([], this.rules, '\n');
  }
}

class Rule extends Base{
  constructor(lhs, rhs){
    super();
    this.lhs = lhs;
    this.rhs = rhs;
  }

  toStr(){
    return [this.lhs, ' - ', this.rhs, ';'];
  }
}

class Lhs extends Base{
  constructor(str='', end=0){
    super();
    this.str = new String(str);
    this.end = end;
  }

  add(str){
    this.str.add(str);
  }

  toStr(){
    return [this.str, this.end ? '#' : ''];
  }
}

class Rhs extends Base{
  constructor(elems=[]){
    super();
    this.elems = new ElementsArray(elems);
  }

  get es(){ return this.elems.elems; }
  get len(){ return this.elems.len; }
  get last(){ return this.elems.last; }
  add(elem){ this.elems.add(elem); }

  parametrize(elemsArr){
    const elemsArrNew = new ElementsArray();

    for(const elem of this.elems)
      elemsArrNew.add(elem.parametrize(elemsArr))

    return elemsArrNew;
  }

  toStr(){
    return this.join([], this.es, '');
  }
}

class ElementsArray extends Base{
  elems = [];

  constructor(elems=null){
    super();

    if(elems !== null)
      for(const elem of elems)
        this.add(elem);
  }

  get len(){ return this.elems.length; }

  get chNum(){ return this.elems.length; }
  getCh(i){ return this.elems[i]; }

  get last(){ return O.last(this.elems); }

  add(elem, rec=0){
    const {elems} = this;

    if(elem instanceof String){
      const {str} = elem;
      if(str.length === 0) return;

      const last = O.last(elems);

      if(last instanceof String){
        last.str += elem.str;
        return;
      }
    }

    if(elem instanceof ElementsArray){
      assert(!rec);

      for(const e of elem.elems)
        this.add(e, 1);

      return;
    }

    elems.push(elem);
  }

  copy(){
    return new ElementsArray(this.elems.map(a => a.copy()));
  }

  toStr(){
    return this.join([], this.elems, '');
  }
}

class Element extends Base{
  copy(){
    const map = new Map();

    this.bottomUp(elem => {
      const ctor = elem.constructor;

      switch(ctor){
        case String:
          map.set(elem, new String(elem.str));
          break;

        case Match:
          map.set(elem, elem);
          break;

        case Group:
          const groupNew = new Group();
          groupNew.elems = map.get(elem.elems);
          map.set(elem, groupNew);
          break;

        case ElementsArray:
          const elemsArrNew = new ElementsArray();

          for(const e of elem.elems)
            elemsArrNew.add(map.get(e));

          map.set(elem, elemsArrNew);
          break;

        default:
          assert.fail(ctor.name);
          break;
      }
    });

    return map.get(this);
  }

  parametrize(elemsArr){
    const map = new Map();

    this.bottomUp(elem => {
      const ctor = elem.constructor;

      switch(ctor){
        case String:
          map.set(elem, new String(elem.str));
          break;

        case Match:
          map.set(elem, elemsArr.copy());
          break;

        case Group:
          const groupNew = new Group();
          groupNew.elems = map.get(elem.elems);
          map.set(elem, groupNew);
          break;

        case ElementsArray:
          const elemsArrNew = new ElementsArray();

          for(const e of elem.elems)
            elemsArrNew.add(map.get(e));

          map.set(elem, elemsArrNew);
          break;

        default:
          assert.fail(ctor.name);
          break;
      }
    });

    return map.get(this);
  }

  replace(needle, elemsArr){
    const map = new Map();

    this.bottomUp(elem => {
      const ctor = elem.constructor;

      if(elem === needle){
        map.set(elem, elemsArr.copy());
        return;
      }

      switch(ctor){
        case String:
          map.set(elem, new String(elem.str));
          break;

        case Match:
          map.set(elem, elem);
          break;

        case Group:
          const groupNew = new Group();
          groupNew.elems = map.get(elem.elems);
          map.set(elem, groupNew);
          break;

        case ElementsArray:
          const elemsArrNew = new ElementsArray();

          for(const e of elem.elems)
            elemsArrNew.add(map.get(e));

          map.set(elem, elemsArrNew);
          break;

        default:
          assert.fail(ctor.name);
          break;
      }
    });

    return map.get(this);
  }
}

class String extends Element{
  constructor(str=''){
    super();
    this.str = str;
  }

  get chNum(){ return 0; }

  add(str){
    this.str += str;
  }

  toStr(){
    return this.str.replace(/[\\\/\#\-\.\(\)\;]|\s/g, a => `\\${a}`);
  }
}

class Match extends Element{
  static instance = null;

  constructor(){
    super();

    if(Match.instance === null)
      Match.instance = this;

    return Match.instance;
  }

  get chNum(){ return 0; }

  toStr(){
    return '.';
  }
}

class Group extends Element{
  constructor(elems=[]){
    super();
    this.elems = new ElementsArray(elems);
  }

  get chNum(){ return 1; }
  getCh(){ return this.elems; }

  get es(){ return this.elems.elems; }
  get len(){ return this.elems.len; }
  get last(){ return this.elems.last; }
  add(elem){ this.elems.add(elem); }

  toStr(){
    const arr = ['('];
    this.join(arr, this.es, '');
    arr.push(')');
    return arr;
  }
}

module.exports = {
  Base,
  System,
  Rule,
  Lhs,
  Rhs,
  ElementsArray,
  Element,
  String,
  Match,
  Group,
};