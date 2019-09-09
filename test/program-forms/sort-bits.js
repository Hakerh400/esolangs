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
    return [a, Buffer.from(O.match(O.sortAsc(O.str2bits(Buffer.from(a).toString('binary')).split('')).join(''), /.{8}|.+/g).map(a => {
      return O.sfcc(parseInt(O.rev(a), 2));
    }).join(''), 'binary')];
  });
};