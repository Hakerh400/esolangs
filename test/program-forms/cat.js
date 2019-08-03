'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');

module.exports = src => {
  return [
    'abcde',
    '1234xyz',
    src,
    Buffer.from(O.ca(O.rand(50, 100), () => 32 + O.rand(95))),
  ].map(a => [a, a]);
};