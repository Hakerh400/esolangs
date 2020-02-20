'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

class Base extends O.Stringifiable{}

module.exports = {
  Base,
};