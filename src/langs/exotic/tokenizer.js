'use strict';

const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

const tokenize = str => {
  const toks = [];
  let ident = null;

  const finishIdent = () => {
    if(ident === null) return;

    toks.push(ident);
    ident = null;
  };

  for(const c of str){
    if(/[a-zA-Z0-9]/.test(c)){
      if(ident === null) ident = c;
      else ident += c;
      continue;
    }

    finishIdent();

    if(/\s/.test(c))
      continue;

    if(/[\.\(\)\*]/.test(c)){
      toks.push(c);
      continue;
    }

    esolangs.err(`Invalid token ${O.sf(c)}`);
  }

  finishIdent();

  return toks;
};

module.exports = {tokenize};