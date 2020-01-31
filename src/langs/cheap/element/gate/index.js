'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const Gate = require('./gate');
const GateNot = require('./gate-not');
const GateOr = require('./gate-or');

module.exports = Object.assign(Gate, {
  GateNot,
  GateOr,
});