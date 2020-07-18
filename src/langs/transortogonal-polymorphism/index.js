'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

const run = (src, input) => {
  // Parse the source code
  {
    const identsInfo = O.obj();
    let main = null;

    const errCycl = ident => {
      esolangs.err(`Identifier ${O.sf(ident)} has cyclic definition`);
    };

    const getIdentInfo = ident => {
      const seen = O.obj();

      while(1){
        if(ident in seen)
          errCycl(ident);

        assert(ident in identsInfo);

        const info = identsInfo[ident];
        if(info instanceof List) return info;

        seen[ident] = 1;
        ident = info.name;
      }
    };

    const toList = elem => {
      if(elem instanceof List) return elem;
      return getIdentInfo(elem);
    };

    // Parse the main element
    {
      const stack = [new List()];
      let ident = null;

      const append = elem => {
        const last = O.last(stack);

        if(last.identsStack.length === 0){
          last.push(elem);
          return;
        }

        identsInfo[last.identsStack.pop()] = elem;
      };

      const pushIdent = () => {
        if(ident === null) return;

        append(new Identifier(ident));

        if(!(ident in identsInfo)){
          identsInfo[ident] = null;
          O.last(stack).identsStack.push(ident);
        }

        ident = null;
      };

      for(const char of src.toString()){
        if(/\s/.test(char)){
          pushIdent();
          continue;
        }

        if(char === '('){
          pushIdent();
          stack.push(new List());
          continue;
        }

        if(char === ')'){
          if(stack.length === 1)
            esolangs.err('Unmatched ")"');

          pushIdent();
          const elem = stack.pop();

          if(elem.identsStack.length !== 0)
            esolangs.err(`Expected definition for identifier ${O.sf(elem.identsStack[0])}, but got ")"`);

          append(elem);

          continue;
        }

        if(ident !== null){
          ident += char
          continue;
        }

        if(char === '\\'){
          ident = '';
          continue;
        }

        ident = char;
        pushIdent();
      }

      pushIdent();

      if(stack.length !== 1)
        esolangs.err('Unmatched "("');

      const mainElem = stack[0];

      if(mainElem.identsStack.length !== 0)
        esolangs.err(`Expected definition for identifier ${O.sf(mainElem.identsStack[0])}, but got EOF`);

      main = toList(mainElem);
    }

    // Substitute identifiers
    {
      const stack = [[main.elems, O.obj()]];

      while(stack.length !== 0){
        const [elems, seen] = stack.pop();

        for(let i = 0; i !== elems.length; i++){
          const elem = elems[i];

          if(elem instanceof List){
            stack.push([elem.elems, seen]);
            continue;
          }

          const {name} = elem;

          if(name in seen)
            errCycl(name);

          const elemNew = getIdentInfo(elem);
          const seenNew = O.nproto(seen);
          seenNew[name] = 1;

          elems[i] = elemNew;
          stack.push([elemNew.elems, seenNew]);
        }
      }
    }

    log(main.expr);
  }

  O.exit();
};

class Element extends O.Stringifiable{}

class List extends Element{
  elems = [];
  identsStack = [];

  constructor(elems=null){
    super();

    if(elems !== null)
      for(const elem of elems)
        this.push(elem);
  }

  get expr(){ return this.elems.join(''); }

  push(elem){
    this.elems.push(elem);
  }

  slice(){
    return new List(this);
  }

  [Symbol.iterator](){
    return this.elems[Symbol.iterator];
  }

  toStr(){
    const arr = ['('];
    this.join(arr, this.elems, '');
    arr.push(')');
    return arr;
  }
}

class Identifier extends Element{
  constructor(name){
    super();

    this.name = name;
  }

  toStr(){
    if(this.name.length === 1) return this.name;
    return `\\${this.name} `;
  }
}

module.exports = run;