'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const Tree = require('./tree');

class Base{}

class Script extends Base{
  constructor(rules){
    super();

    const tree = new Tree();
    tree.addRules(rules);
    tree.finalize();

    this.tree = tree;
  }
}

class Rule extends Base{
  constructor(lhs, rhs){
    super();
    this.lhs = lhs;
    this.rhs = rhs;

    for(const ident in rhs.idents)
      if(!(ident in lhs.idents))
        esolangs.err(`Undefined identifier ${O.sf(ident)}`);

    if(!lhs.isAny && rhs.hasMatch)
      esolangs.err(`Cannot use "." on the right side of a rule with "#"`);
  }
}

class ElementsContainer extends Base{
  idents = O.obj();
  hasMatch = 0;

  constructor(elems=null){
    super();
    this.elems = elems;

    if(elems !== null){
      const {idents} = this;

      for(const elem of elems){
        if(elem.hasMatch) this.hasMatch = 1;

        for(const ident in elem.idents){
          if(!(ident in idents)) idents[ident] = 1;
          else idents[ident]++;
        }
      }
    }
  }
}

class Lhs extends ElementsContainer{
  constructor(elems, isAny=0){
    super(elems);
    this.isEnd = !isAny
    this.isAny = isAny;

    const {idents} = this;

    for(const ident in idents){
      const num = idents[ident];
      if(num !== 1)
        esolangs.err(`Duplicate arguments are not allowed (argument ${O.sf(ident)} appears ${num} times in the same rule)`);
    }
  }
}

class Rhs extends ElementsContainer{
  constructor(elems){
    super(elems);
  }
}

class Element extends ElementsContainer{
  get isBit(){ return 0; }
  get isIdent(){ return 0; }
  get isMatch(){ return 0; }
  get isGroup(){ return 0; }
}

class Group extends Element{
  constructor(elems){
    super(elems);
  }

  get isGroup(){ return 1; }
}

class Match extends Element{
  constructor(){
    super();
    this.hasMatch = 1;
  }

  get isMatch(){ return 1; }
}

class Identifier extends Element{
  constructor(name, inverted=0){
    super();
    this.name = name;
    this.inverted = inverted;
    this.idents[name] = 1;
  }

  get isIdent(){ return 1; }
}

class Bit extends Element{
  constructor(val){
    super();
    this.val = val;
  }

  get isBit(){ return 1; }
}

module.exports = {
  Base,
  Script,
  Rule,
  Lhs,
  Rhs,
  Element,
  Group,
  Match,
  Identifier,
  Bit,
};