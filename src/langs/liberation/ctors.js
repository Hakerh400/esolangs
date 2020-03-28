'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

class Base extends O.Stringifiable{}

class Program extends Base{
  constructor(rules){
    super();

    this.rules = rules;

    // Sanitize rules
    for(const rule1 of rules){
      for(const rule2 of rules){
        if(rule1 === rule2) continue;

        const s1 = rule1.lhsLeftStr;
        const s2 = rule1.lhsRightStr;
        const s3 = rule2.lhsLeftStr;
        const s4 = rule2.lhsRightStr;

        const conflict = (s1.endsWith(s3) || s3.endsWith(s1)) &&
          (s2.startsWith(s4) || s4.startsWith(s2));

        if(conflict)
          esolangs.err(`Conflicting rules:\n\n${rule1}\n${rule2}`);
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

    const lhsParts = this.lhs.toString().split('.');
    this.lhsLeftStr = lhsParts[0];
    this.lhsRightStr = lhsParts[1];
  }

  toStr(){
    return [this.lhs, ' - ', this.rhs];
  }
}

class Lhs extends Base{
  constructor(elems1, elems2, start, end){
    super();

    this.elems1 = elems1;
    this.elems2 = elems2;
    this.start = start;
    this.end = end;
  }

  toStr(){
    let s = '';

    if(this.start) s += '#';
    s += this.elems1.slice().reverse().join('');
    s += '.';
    s += this.elems2.join('');
    if(this.end) s += '#';

    return s;
  }
}

class Rhs extends Base{
  constructor(elems){
    super();

    this.elems = elems;
  }

  toStr(){
    if(this.elems.length === 0) return '/';
    return this.elems.map(a => '01.'[a]).join('');
  }
}

module.exports = {
  Base,
  Program,
  Rule,
  Lhs,
  Rhs,
};