'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');

const mnemonics = [
  'neg', 'inc', 'dec', 'and', 'or', 'xor', 'shl', 'shr',
  'add', 'sub', 'mul', 'div', 'eq', 'neq', 'lt', 'lte',
  'push', 'pop', 'get', 'set', 'geta', 'seta', 'getv', 'setv',
  'gets', 'sets', 'copy', 'if', 'jmp', 'call', 'enter', 'leave',
];

module.exports = mnemonics;