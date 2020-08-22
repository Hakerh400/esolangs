'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

/*
  This class is used for languages that depend on parametrized context.
  Context is an abstract class and only extended classes should be used.
  Extended classes must implement serializable interface.
*/

class Context extends O.Serializable{
  constructor(){
    this.modified = 0;
  }
}

module.exports = Context;