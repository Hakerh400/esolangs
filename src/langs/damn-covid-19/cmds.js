'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');

const cmds = O.enum([
  'goUp',
  'goDown',
  'goLeft',
  'goRight',
  'tapeLeft',
  'tapeRight',
  'flipBit',
  'flipCity',
  'home',
]);

module.exports = cmds;