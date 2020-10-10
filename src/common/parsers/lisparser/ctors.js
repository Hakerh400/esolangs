'use strict';

const assert = require('assert');
const O = require('omikron');

class Base extends O.Stringifiable{}

class ListElement extends Base{
  static parse(str){
    const stack = [new List()];
    let ident = '';

    const addIdent = () => {
      if(ident === '') return;

      O.last(stack).push(new Identifier(ident));
      ident = '';
    };

    for(const c of str){
      if(c === '('){
        const elem = new List();

        O.last(stack).push(elem);
        stack.push(elem);

        continue;
      }

      if(c === ')'){
        if(stack.length === 1)
          esolangs.err('Stray closed parenthese');

        addIdent();
        stack.pop();

        continue;
      }

      if(/\s/.test(c)){
        addIdent();
        continue;
      }

      ident += c;
    }

    addIdent();

    if(stack.length !== 1)
      esolangs.err('Stray open parenthese');

    return stack[0];
  }
}

class List extends ListElement{
  elems = [];

  push(elem){
    this.elems.push(elem);
  }

  get chNum(){ return this.elems.length; }
  getCh(i){ return this.elems[i]; }

  toStr(){
    const arr = ['('];
    this.join(arr, this.elems, ' ');
    arr.push(')');
    return arr;
  }
}

class Identifier extends ListElement{
  constructor(name){
    super();

    this.name = name;
  }

  get chNum(){ return 0; }

  toStr(){
    return this.name;
  }
}

module.exports = {
  Base,
  Identifier,
  ListElement,
  List,
};