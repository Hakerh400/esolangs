'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const fNum = require('./number');
const fTime = require('./time');
const fPath = require('./path');

module.exports = {
  num: fNum,
  time: fTime,
  path: fPath,
};