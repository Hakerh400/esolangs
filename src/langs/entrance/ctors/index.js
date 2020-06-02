'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../../..');

const cs = {
  DISPLAY_PRIORITY: 1,
  GENERATED_IDENTS_PREFIX: '',
};

module.exports = cs;

require('./base');
require('./queue');
require('./expression');
require('./system');
require('./scope');
require('./unique-symbol');
require('./func-def');
require('./temp-struct');
require('./sol-struct');
require('./target');
require('./equation');
require('./binding');
require('./solver');