'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../../..');

const DISPLAY_PRIORITY = 0;

const cs = {
  DISPLAY_PRIORITY,
};

module.exports = cs;

require('./base');
require('./queue');
require('./expression');
require('./system');
require('./target');
require('./equation');
require('./binding');
require('./solver');