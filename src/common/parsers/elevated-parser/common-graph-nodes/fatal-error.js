'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../omikron');
const SG = require('../serializable-graph');
const SF = require('../stack-frame');
const cgs = require('.');

class FatalError extends cgs.Error{
  static errName = 'FatalError';
}

module.exports = FatalError;