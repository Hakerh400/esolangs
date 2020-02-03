'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

module.exports = src => {
  return [
    '',
    'A',
    '123',
  ].map(a => {
    let n = 1;
    
    return [a, Buffer.from(O.match(O.str2bits(Buffer.from(a).toString('binary')).
        replace(/0+/g, '').
        replace(/1/g, () => `1${'0'.repeat(n++)}`),
      /.{8}|.+/g).map(a => {
      return O.sfcc(parseInt(O.rev(a), 2));
    }).join(''), 'binary')];
  });
};