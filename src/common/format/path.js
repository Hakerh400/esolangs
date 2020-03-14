'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

module.exports = fPath;

function fPath(name){
  if(name.startsWith('-') && name.length !== 1){
    var dir = name.match(/[a-zA-Z0-9]+/)[0];
    name = name.substring(dir.length + 2);
    name = path.join(O.dirs[dir], name);
  }

  return path.normalize(name);
}