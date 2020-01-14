'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../../..');

class Gate{
  tick(mode){ O.virtual('tick'); }
}

module.exports = Gate;