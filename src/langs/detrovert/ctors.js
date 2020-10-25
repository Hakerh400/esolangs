'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

const toNative = name => {
  assert(/^[A-Z]/.test(name));
  return `.${name}`;
};

class Base extends O.Stringifiable{}

class Program extends Base{
  static #kCtor = Symbol('ctor');
  static #progs = new WeakMap();

  static fromAst(ast){
    const progs = Program.#progs;

    if(progs.has(ast))
      return progs.get(ast);

    const prog = new Program(Program.#kCtor, ast);
    progs.set(ast, prog);

    return prog;
  }

  types = O.obj();
  patterns = [];

  constructor(kCtor, ast){
    assert(kCtor === Program.#kCtor);
    super();

    {
      new Type(this, 'Base', Type.kBase, {}, 1);
      new Type(this, 'String', 'Base', [new AttributeDef('bit', 'Bit', 1)], 1);
      new Type(this, 'Bit', 'Base', [new AttributeDef('next', 'Bit', 1)], 1);
      new Type(this, 'Bit0', 'Bit', {}, 1);
      new Type(this, 'Bit1', 'Bit', {}, 1);
    }
  }

  hasType(name){
    return name in this.types;
  }

  getType(name){
    assert(this.hasType(name));
    return this.types[name];
  }

  addType(type){
    assert(!this.hasType(type.name));
    this.types[type.name] = type;
  }

  hasNative(name){
    return this.hasType(toNative(name));
  }

  getNative(name){
    return this.getType(toNative(name));
  }

  getTypeSafe(type){
    if(type instanceof Type)
      return type;

    if(typeof type === 'string'){
      if(!this.hasType(type))
        esolangs.err(`Undefined type ${O.sf(type)}`);

      return this.getType(type);
    }

    assert.fail();
  }

  sanitizeTypes(){
    const {types} = this;

    for(const cName in types){
      const type = types[cName];
      const {attrs} = type;

      for(const aName in attrs){
        const tName = attrs[aName];
        assert(typeof tName === 'string');

        if(!(tName in types))
          esolangs.err(`Undefined type ${
            O.sf(tName)} of attribute ${
            O.sf(aName)} in class ${
            O.sf(cName)}`);

        attrs[aName] = types[tName];
      }
    }

    return this;
  }

  addPattern(pat){
    this.patterns.push(pat);
    return this;
  }

  addPatterns(pats){
    for(const pat of pats)
      this.addPattern(pat);

    return this;
  }
}

class Type extends Base{
  static kBase = Symbol('base');

  abstract = 0;

  constructor(prog, name, ext=null, attrs=O.obj(), native=0){
    super();

    if(native) name = toNative(name);

    if(prog.hasType(name))
      esolangs.err(`Redefinition of class ${O.sf(name)}`);

    if(ext === Type.kBase){
      ext = null;
    }else if(ext === null){
      ext = prog.getNative('Base');
    }else if(typeof ext === 'string'){
      if(native) ext = toNative(ext);

      if(!prog.hasType(ext))
        esolangs.err(`Undefined class ${O.sf(ext)} (the superclass of ${O.sf(name)})`);

      ext = prog.getType(ext);
    }

    this.name = name;
    this.ext = ext;

    if(ext !== null) ext.abstract = 1;

    const errRedef = aName => {
      esolangs.err(`Redefinition of attribute ${O.sf(aName)} from class ${O.sf(name)}`);
    };

    if(Array.isArray(attrs)){
      const obj = O.obj();

      for(const attr of attrs){
        const {name: aName, type: aType} = attr;

        if(aName in obj) errRedef(aName);
        obj[aName] = aType;
      }

      attrs = obj;
    }

    {
      const attrsNew = [
        ext !== null ? ext.attrs : O.obj(),
        attrs,
      ];

      const obj = O.obj();

      for(const attrs of attrsNew){
        for(const aName in attrs){
          const attr = attrs[aName];

          if(aName in obj) errRedef(aName);
          obj[aName] = attr;
        }
      }

      this.attrs = obj;
    }

    prog.addType(this);
  }

  exts(other){
    for(let type = this; type !== null; type = type.ext)
      if(type === other) return 1;

    return 0;
  }

  hasAttrib(name){
    return name in this.attrs;
  }

  getAttrib(name){
    assert(this.hasAttrib(name));
    return this.attrs[name];
  }

  addAttrib(name, type){
    assert(!this.hasAttrib(name));
    this.attrs[name] = type;
  }

  new(attrs){
    assert(!this.abstract);
    return new Object(this, attrs);
  }
}

class AttributeDef extends Base{
  constructor(name, type, native=0){
    super();

    if(native){
      assert(typeof type === 'string');
      type = toNative(type);
    }

    this.name = name;
    this.type = type;
  }
}

class Pattern extends Base{
  constructor(matched, tforms){
    super();

    const vars = O.obj();
    const set = new Set();
    const mset = new Set();
    const tset = new Set();

    this.matched = matched;
    this.tforms = tforms;
    this.vars = vars;

    for(const arr of [matched, tforms]){
      loop: for(const info of arr){
        const {name, attrs} = info;

        checkDupe: if(name in vars){
          const old = vars[name];

          // Variable names are unique
          if(info instanceof Update && old instanceof Match && old.update === null){
            old.update = info;
            info.type = old.type;
            break checkDupe;
          }

          esolangs.err(`Redefinition of variable ${O.sf(name)}`);
        }

        addToSets: {
          set.add(info);

          if(info instanceof Match){
            mset.add(info);
            break addToSets;
          }

          tset.add(info);

          if(info instanceof Update){
            if(info.type === null)
              esolangs.err(`Undefined transform variable ${O.sf(name)}`);

            continue loop;
          }
        }

        assert(!(name in vars));
        vars[name] = info;
      }
    }

    {
      for(const info of set){
        const {attrs} = info;
        const names = O.obj();

        for(const attr of attrs){
          const {aName, vName} = attr;

          // All attributes are unique
          if(aName in names)
            esolangs.err(`Duplicate attribute reference ${O.sf(aName)}`);

          checkVar: if(vName !== null){
            // All referenced variables are defined
            if(!(vName in vars)){
              if(info instanceof Match){
                vars[vName] = null;
                break checkVar;
              }

              esolangs.err(`Undefined referenced variable ${O.sf(vName)}`);
            }

            const vInfo = vars[vName];

            // Matched variables do not reference transform variables
            if(info instanceof Match && vInfo instanceof Construct)
              esolangs.err(`Matched attribute ${
                O.sf(aName)} cannot reference transform variable ${
                O.sf(vName)}`);
          }

          names[aName] = 1;
        }
      }
    }

    // All matched variables are accessible from the bound thread object
    {
      const stack = [matched[0]];
      const seen = new Set(stack);

      while(stack.length !== 0){
        const info = stack.pop();
        if(info === null) continue;

        for(const attr of info.attrs){
          const {vName} = attr;
          if(vName === null) continue;

          const vInfo = vars[vName];
          if(seen.has(vInfo)) continue;

          seen.add(vInfo);
          stack.push(vInfo);
        }
      }

      if(seen.size !== mset.size){
        for(const info of mset){
          if(!seen.has(info))
            esolangs.err(`Variable ${
              O.sf(info.name)} is not accessible from the bound thread object`);
        }
      }
    }

    // All attributes have compatible types
    {
      for(const info of set){
        const {type, attrs} = info;
        assert(type !== null);

        for(const attr of attrs){
          const {aName, vName} = attr;

          if(!type.hasAttrib(aName))
            esolangs.err(`Class ${O.sf(type.name)} does not have attribute ${O.sf(aName)}`);

          if(vName === null) continue;

          const vInfo = vars[vName];
          if(vInfo === null) continue;

          const targetType = type.getAttrib(aName);
          const actualType = vInfo.type;
          assert(actualType !== null);

          if(!actualType.exts(targetType))
            esolangs.err(`Variable ${O.sf(vName)} of type ${
              O.sf(actualType.name)} is not assignable to attribute of type ${
              O.sf(targetType.name)} (in the definition of attribute ${
              O.sf(aName)} for variable ${
              O.sf(info.name)})`);
        }
      }
    }
  }

  transform(threads, obj){
    const {matched, tforms, vars} = this;

    const stack = [];
    const assignments = O.obj();
    const seen = O.obj();
    const init = matched[0];

    stack.push([init.name, obj]);
    seen[init.name] = 1;

    while(stack.length !== 0){
      const [vName, obj] = stack.pop();
      const info = vars[vName];

      if(vName === null){
        if(obj !== null) return 0;
        continue;
      }

      if(info !== null && obj === null) return 0;

      if(!(vName in assignments)){
        if(info !== null && !obj.exts(info.type)) return 0;
        assignments[vName] = obj;
      }else{
        if(assignments[vName] !== obj) return 0;
      }

      if(info === null) continue;

      for(const attr of info.attrs){
        const {aName, vName} = attr;
        if(vName in seen) continue;

        stack.push([vName, obj.get(aName)]);
        seen[vName] = 1;
      }
    }

    for(const info of tforms){
      if(info instanceof Construct){
        assignments[info.name] = info.type.new();
        continue;
      }
    }

    for(const info of tforms){
      const {name} = info;

      assert(name in assignments);
      const obj = assignments[name];

      for(let i = 0; i !== info.ths; i++)
        threads.push(new Thread(obj));

      for(const attr of info.attrs){
        const {aName, vName} = attr;

        if(vName === null){
          obj.set(aName, null);
          continue;
        }

        if(!(vName in assignments)){
          assert(vars[vName] === null);
          continue;
        }

        assert(vName in assignments);
        const vObj = assignments[vName];

        obj.set(aName, vObj);
      }
    }

    return 1;
  }
}

class VariableInfo extends Base{
  constructor(name, attrs, type=null){
    super();

    if(name === 'nil')
      esolangs.err(`"nil" is not a valid variable name`);

    {
      const names = O.obj();

      for(const attr of attrs){
        const {aName} = attr;

        if(aName in names)
          esolangs.arr(`Duplicate attribute ${
            O.sf(aName)} in the ${
            this instanceof Match ? 'matched' : 'transform'} variable ${
            O.sf(name)}`);

        names[aName] = 1;
      }
    }

    this.name = name;
    this.attrs = attrs;
    this.type = type;
  }
}

class Match extends VariableInfo{
  update = null;

  constructor(prog, name, type, attrs){
    super(name, attrs, prog.getTypeSafe(type));
  }
}

class Transform extends VariableInfo{
  constructor(name, attrs, ths, type){
    super(name, attrs, type);

    this.ths = ths;
  }
}

class Construct extends Transform{
  constructor(prog, name, type, attrs, ths){
    super(name, attrs, ths, prog.getTypeSafe(type));

    if(this.type.abstract)
      esolangs.err(`Abstract class ${O.sf(this.type.name)} cannot be instantiated`);
  }
}

class Update extends Transform{}

class AttributeRef extends Base{
  constructor(aName, vName){
    super();

    if(vName === 'nil')
      vName = null;

    this.aName = aName;
    this.vName = vName;
  }
}

class Object extends Base{
  constructor(type, attrs=null){
    super();

    this.type = type;

    const tAttrs = type.attrs;
    const attrsObj = O.obj();

    for(const name in tAttrs){
      const aType = tAttrs[name];
      const attr = attrs !== null && O.has(attrs, name) ? attrs[name] : null;

      if(attr !== null) assert(attr.exts(aType));
      attrsObj[name] = attr;
    }

    this.attrs = attrsObj;
  }

  get(name){
    const {attrs} = this;
    assert(name in attrs);
    return attrs[name];
  }

  set(name, val){
    const {type, attrs} = this;

    assert(name in attrs);
    if(val !== null) assert(val.exts(type.getAttrib(name)));

    attrs[name] = val;
  }

  exts(type){
    return this.type.exts(type);
  }
}

class Thread extends Base{
  constructor(obj){
    super();

    this.obj = obj;
  }
}

module.exports = {
  Base,
  Program,
  Type,
  AttributeDef,
  Pattern,
  Match,
  Transform,
  Construct,
  Update,
  AttributeRef,
  Object,
  Thread,
};