'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');

class Command{
  constructor(type, data){
    this.type = type;
    this.data = data;
  }
}

module.exports = Command;