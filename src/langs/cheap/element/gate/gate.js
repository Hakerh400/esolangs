'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const Element = require('../element');

class Gate extends Element{
  get tick(){ O.virtual('tick'); }
  get isGate(){ return 1; }
}

module.exports = Gate;