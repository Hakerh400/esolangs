'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../../..');

const cs = {
  DISPLAY_PRIORITY: 1,
  GENERATED_IDENTS_PREFIX: '',
};

module.exports = cs;

const Base = require('./base');
const Queue = require('./queue');
const Expression = require('./expression');
const System = require('./system');
const Scope = require('./scope');
const UniqueSymbol = require('./unique-symbol');
const FunctionDefinition = require('./func-def');
const TemporaryStructure = require('./temp-struct');
const SolutionStructure = require('./sol-struct');
const Target = require('./target');
const Equation = require('./equation');
const Binding = require('./binding');
const Solver = require('./solver');