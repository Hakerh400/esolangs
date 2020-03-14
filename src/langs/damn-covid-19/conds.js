'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');

const conds = O.enum([
  'isCity',
  'isCityUp',
  'isCityDown',
  'isCityLeft',
  'isCityRight',
  'isBit',
  'isFull',
]);

module.exports = conds;