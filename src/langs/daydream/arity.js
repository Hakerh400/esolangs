'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');

const arity = [
  1, 1, 1, 2, 2, 2, 2, 2,
  2, 2, 2, 2, 2, 2, 2, 2,
  1, 1, 1, 2, 1, 2, 1, 2,
  1, 2, 3, 1, 1, 1, 1, 2,
]

module.exports = arity;