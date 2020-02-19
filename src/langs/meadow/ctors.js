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
    for(const name in types){
      const type = types[name];
      let t = type;

      while(1){
        const {ext} = t;
        if(ext.isBase) break;

        t = this.getType(type, t.ext.name);
        type.addInherentType(t);
      }
    }

    // Ensure that templates, extended types and attributes are consistent
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

        if(def.inherits(type)){
          const s1 = customAllowed ? 'extended type' : 'templates';

          if(def === type)
            esolangs.err(`Type ${
              O.sf(name)} cannot be used in the definition of its own ${
              s1}. Relevant definition:\n\n${type}`);

          const s2 = this.getType(type, def.ext.name) === type ? 'directly' : 'indirectly';

          esolangs.err(`Type ${
            O.sf(t.name)} cannot be used in the definition of ${s1} for type ${
            O.sf(name)}, because ${
            O.sf(t.name)} is ${s2} extended from ${
            O.sf(name)}. Relevant definitions:\n\n${
            type}\n\n${def}`);
        }

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

    const push = (typesArr, original, t=original) => {
      assert(original instanceof Type);
      assert(t instanceof Type);
      assert(t.templates.length === original.templates.length);

      if(original.templates.length === 0) return;

      typesArr.push([original, t]);
    };

    const checkTypes = (context, typesArr) => {
      const queue = typesArr;

      while(queue.length !== 0){
        const [original, tt] = queue.shift();
        assert(tt.templates.length !== 0);

        const def = this.getType(context, tt.name);
        const defTemplates = def.templates;

        tt.templates.forEach((t, index1) => {
          const mustInherit = defTemplates[index1].ext;

          let ok = this.inherits(context, t, mustInherit);

          if(ok){
            const queue = [[t, mustInherit]];

            while(queue.length !== 0){
              const [t, mustInherit] = queue.shift();

              if(!this.inherits(context, t, mustInherit)){
                ok = 0;
                break;
              }

              let t1 = t;

              while(t1.name !== mustInherit.name){
                const def = this.getType(context, t1.name);
                const obj = def.getTemplatesObj(t1.templates);

                t1 = def.ext.template(obj);
              }

              t1.templates.forEach((t, i) => {
                queue.push([t, mustInherit.templates[i]]);
              });
            }
          }

          if(!ok)
            esolangs.err(`Type "${
              t}" from type expression "${
              original}" (in the definition of ${
              O.sf(context.name)}) cannot be constructed, because it violates the constraint from type definition ${
              O.sf(def.name)} that "${
              defTemplates[index1].name}" must be more specific or equal to "${
              mustInherit}". Relevant definitions:\n\n${
              def}\n\n${context}`);

          t.templates.forEach((template, index2) => {
            push(typesArr, defTemplates[index1].ext.templates[index2], template);
          });
        });
      }
    };

    // Ensure that templates, extended types and attributes
    // are consistent with constraints of templated types
    for(const name in types){
      const type = types[name];
      const {templates} = type;
      const typesArr = [];

      for(const template of templates)
        push(typesArr, template.ext);

      push(typesArr, type.ext, type.ext.templateWithExts(templates));

      for(const attrib of type.attribs){
        push(typesArr, attrib.type, attrib.type.templateWithExts(templates));
      }

      checkTypes(type, typesArr);
    }
  }

  getType(context, name){
    assert(typeof name === 'string');
    assert(name !== '*');

    if(!(name in this.types))
      this.err(context, `Missing definition for type ${O.sf(name)}`);

    return this.types[name];
  }

  getFunc(context, name){
    assert(typeof name === 'string');
    
    if(!(name in this.funcs))
      this.err(context, `Missing definition for function ${O.sf(name)}`);

    return this.funcs[name];
  }

  getaType(context, name, ext=null){
    assert(typeof name === 'string');
    
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
    assert(typeof name === 'string');

    if(!(name in this.annotations))
      this.err(context, `Missing definition for annotated function ${O.sf(name)}`);

    const ent = this.annotations[name];

    if(!ent.isFunc)
      this.err(context, `${O.sf(ent.name)} must be a function. Current definition:\n\n${ent}`);

    if(ent.isExternal)
      this.err(context, `Function ${O.sf(ent.name)} must define a function body. Current definition:\n\n${ent}`);

    return ent;
  }

  inherits(context, type1, type2){
    assert(type1 instanceof Type);
    assert(type2 instanceof Type);

    if(type2.isBase) return 1;
    if(type1.isBase) return 0;

    const def1 = this.getType(context, type1.name);
    const def2 = this.getType(context, type2.name);

    return def1.inherits(def2);
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
  protoChain = [this];
  inherentTypes = new Set([this]);
  inheritedByTypes = new Set([this]);

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

  addInherentType(type){
    assert(type instanceof TypeDefinition);

    const {inherentTypes, protoChain} = this;

    protoChain.push(type);

    if(inherentTypes.has(type))
      esolangs.err(`Type ${
        O.sf(this.name)} has circular prototype chain. Current definition:\n\n${
        this}\n\nPrototype chain:\n\n${
        O.sfa(protoChain.map(a => a.name))}`);

    inherentTypes.add(type);
    type.inheritedByTypes.add(this);
  }

  inherits(type){ return this.inherentTypes.has(type); }
  inheritedBy(type){ return this.inheritedByTypes.has(type); }

  getTemplatesObj(templates){
    const obj = O.obj();

    this.templates.forEach((template, index) => {
      obj[template.name] = templates[index];
    });

    return obj;
  }

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

    if(expr !== null) arr.push(': ', expr);
    else arr.push(';');

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

  template(obj){
    const mainArr = [];
    const queue = [[mainArr, this]];

    while(queue.length !== 0){
      const [arr, type] = queue.shift();
      const {name} = type;

      if(name in obj){
        arr.push(obj[name]);
        continue;
      }

      const newArr = [];
      const newType = new Type(name, newArr);

      arr.push(newType);

      for(const template of type.templates)
        queue.push([newArr, template]);
    }

    return mainArr[0];
  }

  templateWithExts(templates){
    const obj = O.obj();

    for(const template of templates)
      obj[template.name] = template.ext;

    return this.template(obj);
  }

  copy(){
    const mainArr = [];
    const queue = [[mainArr, this]];

    while(queue.length !== 0){
      const [arr, type] = queue.shift();

      const newArr = [];
      const newType = new Type(this.name, newArr);

      arr.push(newType);

      for(const template of type.templates)
        queue.push([newArr, template]);
    }

    return mainArr[0];
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
};