'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');

const rules = {
  ['[script]'](e){
    return 0;
  },
};

module.exports = rules;