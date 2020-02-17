'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
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

    // Add types and functions
    for(const def of defs){
      const {annotation, name} = def;

      if(annotation !== null){
        const aname = annotation.name;

        if(aname in annotations)
          esolangs.err(`Cannot reuse the same annotation ${
            O.sf(aname)}. First usage:\n\n${
            annotations[aname]}\n\nSecond usage:\n\n${
            def}`);

        annotations[aname] = def;
      }

      const hasType = name in types;
      const hasFunc = name in funcs;
      const hasAny = hasType || hasFunc;

      const redef = hasAny ? `Redefinition of ${
        O.sf(name)}. First definition:\n\n${
        (hasType ? types : funcs)[name]}\n\nSecond definition:\n\n${
        def}` : null;

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

    // Ensure there are no circular prototype chains
    // Add references to extended type definitions
    for(const name in types){
      const type = types[name];
      const seen = new Set([type]);
      const protoChain = [type];
      let t = type;

      if(!type.ext.isBase)
        type.extDef = this.getType(type, type.ext.name);

      while(1){
        const extName = t.ext.name;
        if(extName === '*') break;

        const ext = this.getType(type, extName);

        if(seen.has(ext))
          esolangs.err(`Type ${
            O.sf(type.name)} has circular prototype chain. Current definition:\n\n${
            type}\n\nPrototype chain:\n\n${
            O.sfa([...protoChain.map(a => a.name), type.name])}`);

        t = ext;

        seen.add(t);
        protoChain.push(t);
      }
    }

    // Ensure type templates are consistent
    for(const name in types){
      const type = types[name];

      const namesObj = O.obj();
      const typesQueue = [];

      for(const template of type.templates)
        namesObj[template.name] = template;

      for(const template of type.templates){
        const ext = template.ext;

        if(ext.name in namesObj)
          esolangs.err(`Cannot extend custom type ${
            O.sf(ext.name)}. Relevant definition:\n\n${
            type}`);

        typesQueue.push([ext, 0]);
      }

      typesQueue.push([type.ext, 1]);

      while(typesQueue.length !== 0){
        const [t, customAllowed] = typesQueue.shift();
        if(t.isBase) continue;

        if(t.name in namesObj){
          if(!customAllowed)
            esolangs.err(`Custom type ${
              O.sf(t.name)} cannot be recursively defined for type ${
              O.sf(type.name)}. Relevant definition:\n\n${
              type}`);

          if(t.templates.length !== 0)
            esolangs.err(`Custom type ${
              O.sf(t.name)} cannot be templated. Relevant definition:\n\n${
              type}`);

          continue;
        }

        const def = this.getType(type, t.name);
        const expectedLen = def.templates.length;
        const actualLen = t.templates.length;

        if(actualLen !== expectedLen)
          esolangs.err(`Generic type ${
            O.sf(t.name)} takes ${
            O.gnum('template argument', expectedLen)} ${
            O.sfa(def.templates.map(a => a.name))}, but it is supplied with ${
            O.gnum('argument', actualLen)} ${
            O.sfa(t.templates.map(a => a.name))}. Relevant definitions:\n\n${
            def}\n\n${type}`);

        for(const template of t.templates)
          typesQueue.push([template, customAllowed]);
      }
    }
  }

  getType(context, name){
    assert(name !== '*');

    if(!(name in this.types))
      this.err(context, `Missing definition for type ${O.sf(name)}`);

    return this.types[name];
  }

  getFunc(context, name){
    if(!(name in this.funcs))
      this.err(context, `Missing definition for function ${O.sf(name)}`);

    return this.funcs[name];
  }

  getaType(context, name, ext=null){
    if(!(name in this.annotations))
      this.err(context, `Missing definition for annotated type ${O.sf(name)}`);

    const ent = this.annotations[name];

    if(!ent.isType)
      this.err(context, `${O.sf(ent.name)} must be a type. Current definition:\n\n${ent}`);

    if(ext !== null){
      if(ext === '*'){
        if(!ent.ext.isBase)
          this.err(context, `${O.sf(ent.name)} cannot extend any type. Current definition:\n\n${ent}`);
      }else{
        const actual = this.getType(context, ent.ext.name);
        const expected = this.getaType(context, ext);

        if(actual !== expected)
          this.err(context, `${O.sf(ent.name)} must extend ${
            O.sf(expected.name)}. Current definition of ${
            O.sf(ent.name)}:\n\n${ent}\n\nDefinition of ${O.sf(expected.name)}:\n\n${expected}`);
      }
    }

    return ent;
  }

  getaFunc(context, name){
    if(!(name in this.annotations))
      this.err(context, `Missing definition for annotated function ${O.sf(name)}`);

    const ent = this.annotations[name];

    if(!ent.isFunc)
      this.err(context, `${O.sf(ent.name)} must be a function. Current definition:\n\n${ent}`);

    if(ent.isExternal)
      this.err(context, `Function ${O.sf(ent.name)} must define a function body. Current definition:\n\n${ent}`);

    return ent;
  }

  toStr(){
    return this.join([], this.defs, '\n\n');
  }

  err(context, msg){
    esolangs.err(`${msg}\n\nRelevant context:\n\n${context}`);
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
  extDef = null;

  constructor(name, templates, ext, attribs){
    super();

    this.name = name;
    this.templates = templates;
    this.ext = ext;
    this.attribs = attribs;

    const templatesObj = O.obj();
    const attribsObj = O.obj();

    for(const template of templates){
      const {name: templateName} = template;

      if(templateName in templatesObj)
        esolangs.err(`Type definition ${
          O.sf(name)} has multiple templates named ${
          O.sf(templateName)}. Current definition:\n\n${
          this}`);

      templatesObj[templateName] = 1;
    }

    for(const attrib of attribs){
      const {name: attribName} = attrib;

      if(attribName in attribsObj)
        esolangs.err(`Type definition ${
          O.sf(name)} has multiple attributes named ${
          O.sf(attribName)}. Current definition:\n\n${
          this}`);

      attribsObj[attribName] = 1;
    }
  }

  get isType(){ return 1; }

  commonProto(type){
    const set1 = new Set([this]);
    const set2 = new Set([type]);
    let t1 = this;
    let t2 = type;

    while(!(t1.isBase && t2.isBase)){
      if(!t1.isBase) t1 = t1.extDef;
      if(!t2.isBase) t2 = t2.extDef;

      if(set2.has(t1)) return t1;
      if(set1.has(t2)) return t2;
    }

    return null;
  }

  comparable(type){
    const proto = this.commonProto(type);
    return proto === this || proto === type;
  }

  eq(type){ return this.name === type.name; }
  neq(type){ return !this.eq(type); }
  lt(type){ return this.neq(type) && this.le(type); };
  gt(type){ return !this.le(type); };
  ge(type){ return !this.lt(type); }

  le(type){
    if(!this.comparable(type))
      esolangs.err(`Type ${
        O.sf(this.name)} is not comparable with ${
        O.sf(type.name)}. Definition of ${
        O.sf(this.name)}:\n\n${
        this}\n\nDefinition of ${
        O.sf(type.name)}:\n\n${
        type}`);

    const proto = this.commonProto(type);
    return proto === type;
  }

  inherits(type){ return this.le(type); }

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
        arr.push(tab(), attrib, ';\n');
      arr.push('}');
    }

    return arr;
  }
}

class FunctionDefinition extends Definition{
  constructor(name, args, expr=null){
    super();

    this.name = name;
    this.args = args;
    this.expr = expr;
  }

  get isFunc(){ return 1; }
  get isExternal(){ return this.expr === null; }

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

    if(expr !== null)
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