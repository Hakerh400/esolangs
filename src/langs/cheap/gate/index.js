'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../../..');
const Gate = require('./gate');
const GateNot = require('./gate-not');
const GateOr = require('./gate-or');

module.exports = {
  Gate,
  GateNot,
  GateOr,
};