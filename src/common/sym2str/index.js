'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const arrOrder = require('../arr-order');

const defaultChars = O.chars('a', 'z');

const Sym2str = (chars=defaultChars) => {
  const syms = new Map();
  let num = 0;

  const sym2str = sym => {
    if(syms.has(sym))
      return syms.get(sym);

    const str = arrOrder.str(chars, ++num);
    syms.set(sym, str);

    return str;
  };

  return sym2str;
};


module.exports = Sym2str;