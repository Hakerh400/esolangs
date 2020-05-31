'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../../..');

const cs = {};
module.exports = cs;

require('./base');
require('./queue');
require('./system');
require('./solver');