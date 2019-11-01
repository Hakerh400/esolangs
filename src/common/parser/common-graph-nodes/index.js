'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../omikron');
const SG = require('../../serializable-graph');
const SF = require('../stack-frame');

const cwd = __dirname;

const nodes = [
  'script',
  'function',
  'execute',

  'error',
  'syntax-error',
  'reference-error',
  'type-error',
  'range-error',
  'security-error',
  'fatal-error',
  'unknown-error',

  'string',
  'array',
  'set',
  'map',
  'object',
  
  'undefined',
  'null-obj',

  'read',
];

const ctorsArr = [];

const cgs = {
  ctorsArr,
  str,
};

module.exports = cgs;

for(let i = 0; i !== nodes.length; i++){
  const ctor = require(path.join(cwd, nodes[i]));
  ctorsArr.push(ctor);
  cgs[ctor.name] = ctor;
}

function str(g, str){
  if(str === null) return null;
  return new cgs.String(g, str);
}