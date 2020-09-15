'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('./esolangs');
const cli = require('./cli');

module.exports = esolangs;

if(cli.isInvoked) cli.exec().catch(O.error);