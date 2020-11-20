'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');

class ProgramError extends O.CustomError{}

module.exports = ProgramError;