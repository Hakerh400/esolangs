'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const Info = require('./info');

class Database{
  table = [];

  syms = O.obj();
  pairs = O.obj();

  getInfo(expr){
    if(isSym(expr)){
      const {syms} = this;
      const sym = expr;

      if(O.has(syms, sym))
        return syms[sym];

      const info = this.infoFromExpr(expr);
      return syms[sym] = info;
    }

    const {pairs} = this;
    const [fst, snd] = expr;
    const fsti = fst.index;
    const sndi = snd.index;

    if(O.has(pairs, fsti)){
      if(O.has(pairs[fsti], sndi))
        return pairs[fsti][sndi];
    }else{
      pairs[fsti] = O.obj();
    }

    const info = this.infoFromExpr(expr);
    return pairs[fsti][sndi] = info;
  }

  reduce(from, to){
    assert(from.reducedTo === null);

    if(from !== to)
      assert(to.reducedTo === to);

    from.reducedTo = to;
    to.reducedFrom.push(from);

    return to;
  }

  reduceToItself(info){
    return this.reduce(info, info);
  }

  infoFromExpr(expr){
    const {table} = this;
    const index = table.length;
    const info = new Info();

    info.index = index;
    info.expr = expr;

    if(isSym(expr)){
      const sym = expr;

      info.baseSym = sym;
      info.argsNum = 0;
    }else{
      const [fst, snd] = expr;

      info.baseSym = fst.baseSym;
      info.argsNum = fst.argsNum + 1;

      fst.refs.push(index);
      if(fst !== snd) snd.refs.push(index);
    }

    table.push(info);

    return info;
  }

  toString(){
    return this.table.map(info => {
      const {expr, reducedTo} = info;

      const exprStr = isSym(expr) ? expr.description : O.sfa(expr.map(a => a.index));
      const reducedStr = reducedTo !== null ? ` ---> ${reducedTo.index}` : '';

      return `${info.index}: ${exprStr}${reducedStr}`;
    }).join('\n');
  }
}

const isSym = expr => {
  return typeof expr === 'symbol';
};

const isPair = expr => {
  return typeof expr === 'object';
};

module.exports = Object.assign(Database, {
  isSym,
  isPair,
});