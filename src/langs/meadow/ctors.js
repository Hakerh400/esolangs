'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

const TAB_SIZE = 2;

const tab = (num=1, str='') => {
  return `${' '.repeat(TAB_SIZE * num)}${str}`;
};

class Base extends O.Stringifiable{}

class Program extends Base{
  constructor(defs){
    super();

    this.defs = defs;

    const types = this.types = O.obj();
    const funcs = this.funcs = O.obj();
    const annotations = this.annotations = O.obj();

    for(const def of defs){
      const {annotation, name} = def;

      if(annotation !== null){
        const aname = annotation.name;

        if(aname in annotations)
          esolangs.err(`Cannot reuse the same annotation ${
            O.sf(aname)}. First usage:\n\n${
            annotations[aname].toString()}\n\nSecond usage:\n\n${
            def.toString()}`);

        annotations[aname] = def;
      }

      const hasType = name in types;
      const hasFunc = name in funcs;
      const hasAny = hasType || hasFunc;

      const redef = hasAny ? `Redefinition of ${
        O.sf(name)}. First definition:\n\n${
        (hasType ? types : funcs)[name].toString()}\n\nSecond definition:\n\n${
        def.toString()}` : null;

      if(def.isType){
        if(hasAny)
          esolangs.err(redef);

        types[def.name] = def;
        continue;
      }

      if(hasType)
        esolangs.err(redef);

      if(!hasFunc)
        funcs[name] = [];

      funcs[name].push(def);
    }

    log(this.toString());
  }

  toStr(){
    return this.join([], this.defs, '\n\n');
  }
}

class Annotation extends Base{
  constructor(name, attribs){
    super();

    this.name = name;
    this.attribs = attribs;
  }

  toStr(){
    const {name, attribs} = this;
    const arr = [];

    arr.push('@', name);

    if(attribs.length !== 0){
      arr.push('{');
      this.join(arr, attribs, ', ');
      arr.push('}');
    }

    return arr;
  }
}

class AnnotatedAttribute extends Base{
  constructor(internal, external=internal){
    super();

    this.internal = internal;
    this.external = external;
  }

  toStr(){
    const {internal, external} = this;
    const arr = [];

    arr.push(internal);

    if(external !== internal)
      arr.push(': ', external);

    return arr;
  }
}

class Definition extends Base{
  annotation = null;

  get isType(){ return 0; }
  get isFunc(){ return 0; }

  annotate(annotation){
    this.annotation = annotation;
    return this;
  }

  stringifyAnnotation(arr){
    const {annotation} = this;

    if(annotation !== null)
      arr.push(annotation, '\n');

    return arr;
  }
}

class TypeDefinition extends Definition{
  constructor(name, templates, ext, attribs){
    super();

    this.name = name;
    this.templates = templates;
    this.ext = ext;
    this.attribs = attribs;
  }

  get isType(){ return 1; }

  toStr(){
    const {name, templates, ext, attribs} = this;
    const arr = [];

    this.stringifyAnnotation(arr);

    arr.push(name);

    if(templates.length !== 0){
      arr.push('<');
      this.join(arr, templates, ', ');
      arr.push('>');
    }

    if(!ext.isBase)
      arr.push(' ~ ', ext);

    if(attribs.length !== 0){
      arr.push('{\n');
      for(const attrib of attribs)
        arr.push(tab(), attrib, ';\n')
      arr.push('}');
    }

    return arr;
  }
}

class FunctionDefinition extends Definition{
  constructor(name, args, expr){
    super();

    this.name = name;
    this.args = args;
    this.expr = expr;
  }

  get isFunc(){ return 1; }

  toStr(){
    const {name, args, expr} = this;
    const arr = [];

    this.stringifyAnnotation(arr);

    arr.push(name);

    if(args.length !== 0){
      arr.push('(');
      this.join(arr, args, ', ');
      arr.push(')');
    }

    arr.push(': ', expr);

    return arr;
  }
}

class Type extends Base{
  static base(){
    return new Type('*', []);
  }

  static from(arr){
    if(arr.length === 0)
      return Type.base();

    return arr[0];
  }

  constructor(name, templates){
    super();

    this.name = name;
    this.templates = templates;
  }

  get isBase(){
    return this.name === '*';
  }

  toStr(){
    const {name, templates} = this;
    const arr = [];

    arr.push(name);

    if(templates.length !== 0){
      arr.push('<');
      this.join(arr, templates, ', ');
      arr.push('>');
    }

    return arr;
  }
}

class Template extends Base{
  constructor(name, ext){
    super();

    this.name = name;
    this.ext = ext;
  }

  toStr(){
    const {name, templates, ext, attribs} = this;
    const arr = [];

    arr.push(name);

    if(!ext.isBase)
      arr.push(' ~ ', ext);

    return arr;
  }
}

class Attribute extends Base{
  constructor(type, name){
    super();

    this.type = type;
    this.name = name;
  }

  toStr(){
    return [this.type, ' ', this.name];
  }
}

class FormalArgument extends Base{
  constructor(type, name=null){
    super();

    this.type = type;
    this.name = name;
  }

  toStr(){
    const {type, name} = this;
    const arr = [];

    arr.push(type);

    if(name !== null)
      arr.push(' ', name);

    return arr;
  }
}

class Expression extends Base{
  isInv(){ return 0; }
  isAccess(){ return 0; }
}

class Invocation extends Expression{
  constructor(target, args){
    super();

    this.target = target;
    this.args = args;
  }

  isInv(){ return 1; }

  toStr(){
    const {target, args} = this;
    const arr = [];

    arr.push(target);

    if(args.length !== 0){
      arr.push('(');
      this.join(arr, args, ', ');
      arr.push(')');
    }

    return arr;
  }
}

class AttributeAccess extends Expression{
  constructor(expr, attrib){
    super();

    this.expr = expr;
    this.attrib = attrib;
  }

  isAccess(){ return 1; }

  toStr(){
    return [this.expr, '.', this.attrib];
  }
}

module.exports = {
  Base,
  Program,
  Annotation,
  AnnotatedAttribute,
  Definition,
  TypeDefinition,
  FunctionDefinition,
  Type,
  Template,
  Attribute,
  FormalArgument,
  Invocation,
  AttributeAccess,
};