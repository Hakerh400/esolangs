'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../../..');

module.exports = src => {
  return [
    0, 255, 50, 80,
  ].map(a => [Buffer.from([a]), Buffer.from([a ^ 1]), ['text', 'text']]);
};