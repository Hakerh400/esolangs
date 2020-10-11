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

        addIdent();
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

  get isEmpty(){ return this.elems.length === 0; }

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

class Type{
  constructor(name=null, ext=null, attribs=[]){
    this.name = name;
    this.ext = ext;
    this.attribs = attribs;
  }

  get isConcrete(){ O.virtual('isConcrete'); }
  get isAbstract(){ return !this.isConcrete; }

  assertNotCircular(){
    const exts = new Set();

    for(let e = ext; e !== null; e = e.ext){
      if(exts.has(ext))
        esolangs.err(`Type ${O.sf(name)} has circular prototype chain`);

      exts.add(e);
    }
  }

  extends(other){
    for(let e = this; e !== null; e = e.ext)
      if(e === other) return 1;

    return 0;
  }
}

class AbstractType extends Type{
  get isConcrete(){ return 0; }
}

class ConcreteType extends Type{
  get isConcrete(){ return 1; }
}

class Attribute{
  constructor(name=null, val=null){
    this.name = name;
    this.val = val;
  }
}

class ElementAttribute extends Attribute{}
class ListAttribute extends Attribute{}
class RestAttribute extends Attribute{}

class AttributeValue{}

class IdentifierValue extends AttributeValue{
  static instance = null;

  constructor(){
    super();

    if(IdentifierValue.instance !== null)
      return IdentifierValue.instance;

    IdentifierValue.instance = this;
  }
}

class TypeValue extends AttributeValue{
  constructor(name=null){
    super();

    this.name = name;
  }
}

class ASTNode extends Base{
  constructor(type=null, attribs=O.obj()){
    super();

    this.type = type;
    this.attribs = attribs;
  }

  get chNum(){ return this.type.attribs.length; }
  getCh(i){ return this.attribs[this.type.attribs[i].name]; }
}

module.exports = {
  Base,
  Identifier,
  ListElement,
  List,
  Type,
  AbstractType,
  ConcreteType,
  Attribute,
  ElementAttribute,
  ListAttribute,
  RestAttribute,
  AttributeValue,
  IdentifierValue,
  TypeValue,
  ASTNode,
};