'use strict';

const O = require('omikron');
const original = require('../esolangs');

const list = original.slice().sort(({name: a}, {name: b}) => {
  return a > b ? 1 : a < b ? -1 : 0;
});

module.exports = list;