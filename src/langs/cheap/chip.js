'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const Element = require('./element');
const Pin = require('./pin');

const {Gate, Template, Component} = Element;

class Chip extends O.Serializable{
  constructor(){
    super();

    this.templates = Template.createInitials(this);

    this.io = null;
    this.done = 0;
  }

  static deser(ser=new O.Serializer()){
    const chip = new Chip();

    return chip;
  }

  setIO(io){
    this.io = io;
  }
}

module.exports = Chip;