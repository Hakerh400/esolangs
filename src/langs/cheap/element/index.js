'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const Element = require('./element');
const Gate = require('./gate');
const Template = require('./template');
const Component = require('./Component');

module.exports = Object.assign(Element, {
  Gate,
  Template,
  Component,
});