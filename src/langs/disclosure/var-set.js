'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');

class VarSet{
  vars = O.obj();
  size = 0;

  static intersect(s1, s2){
    const set = new VariableSet();

    for(const vari of s1)
      if(s2.has(vari.name))
        set.add(vari)

    return set;
  }

  static union(s1, s2){
    const set = new VariableSet();

    for(const vari of s1)
      set.add(vari)

    for(const vari of s2)
      set.add(vari)

    return set;
  }

  intersect(set){
    for(const vari of this)
      if(!set.has(vari.name))
        this.delete(vari.name);

    return this;
  }

  union(set){
    for(const vari of set)
      this.add(vari);

    return this;
  }

  has(name){
    const {vars} = this;

    return name in vars;
  }

  get(name){
    const {vars} = this;

    if(name in vars) return vars[name]
    return null;
  }

  add(vari){
    const {vars} = this;
    const {name} = vari;

    if(!(name in vars)) this.size++;
    vars[name] = vari;

    return this;
  }

  delete(name){
    const {vars} = this;

    if(name in vars) this.size--;
    delete vars[name];
  }

  toArr(){
    return Array.from(this);
  }

  toMap(){
    const map = O.obj();
    let i = 0;

    for(const vari of this)
      map[vari.name] = i++;

    return map;
  }

  *[Symbol.iterator](){
    const {vars} = this;

    for(const name in vars)
      yield vars[name];
  }
}

module.exports = VarSet;