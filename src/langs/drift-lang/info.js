'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');

class Info{
  index = null;
  expr = null;
  reducedTo = null;
  reducedFrom = [];
  refs = [];
  baseSym = null;
  argsNum = null;
}

module.exports = Info;