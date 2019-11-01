'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Pattern = require('./pattern');

class Section{
  constructor(){}

  get sectName(){ return this.constructor.sectName; }
}

class Match extends Section{
  constructor(){
    super();

    this.pats = [];
  }

  addPat(pat){ this.pats.push(pat); }
  len(){ return this.path.length; }
}

class Include extends Match{
  static sectName = 'include';

  constructor(){
    super();
  }
}

class Exclude extends Match{
  static sectName = 'exclude';

  constructor(){
    super();
  }
}

class Code extends Section{
  constructor(){
    super();

    this.func = null;
  }

  setFunc(args, code){
    if(typeof args === 'function'){
      this.func = args;
      return;
    }

    const func = new Function(args.join(', '), code);
    this.func = func;
  }
}

class Before extends Code{
  static sectName = 'before';

  constructor(){
    super();
  }
}

class Inside extends Code{
  static sectName = 'inside';

  constructor(){
    super();
  }
}

class After extends Code{
  static sectName = 'after';

  constructor(){
    super();
  }
}

Section.Match = Match;
Section.Include = Include;
Section.Exclude = Exclude;
Section.Before = Before;
Section.Inside = Inside;
Section.After = After;

module.exports = Section;