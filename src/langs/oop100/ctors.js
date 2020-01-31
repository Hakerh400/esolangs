'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

class Base{}

class Class extends Base{
  ext = null;

  constructor(name, extName){
    super();
    this.name = name;
    this.extName = extName;
  }

  static construct(name, extName, ents){
    if(ents !== null) return new RegularClass(name, extName, ents);
    return new ExternalClass(name, extName);
  }

  iter(func){
    let c = this;

    while(c !== null){
      if(func(c)) return 1;
      c = c.ext;
    }

    return 0;
  }

  extends(cref){
    return this.iter(c => cref === c);
  }

  getProtoChain(){
    const chain = [];
    this.iter(c => chain.push(c));
    return chain;
  }

  instantiate(){
    return new Instance(this);
  }

  get isRegular(){ return 0; }
  get isExternal(){ return 0; }
}

class RegularClass extends Class{
  attribs = O.obj();
  methods = O.obj();
  getters = O.obj();
  setters = O.obj();

  constructor(name, extName, ents){
    super(name, extName);
    this.ents = ents;
  }

  get isRegular(){ return 1; }
}

class ExternalClass extends Class{
  get isExternal(){ return 1; }
}

class ClassEntity extends Base{
  constructor(name, type){
    super();
    this.name = name;
    this.type = type;
  }

  get isAttrib(){ return 0; }
  get isMethod(){ return 0; }
}

class Attribute extends ClassEntity{
  get isAttrib(){ return 1; }
}

class Method extends ClassEntity{
  constructor(name, type, args){
    super(name, type);
    this.args = args;
  }

  static construct(name, type, args, expr){
    if(expr !== null) return new RegularMethod(name, type, args, expr);
    return new ExternalMethod(name, type, args);
  }

  sameSignature(method){
    if(this.name !== method.name) return 0;
    if(this.type !== method.type) return 0;

    const args1 = this.args;
    const args2 = method.args;
    if(args1.length !== args2.length) return 0;

    for(let i = 0; i !== args1.length; i++)
      if(args1[i].type !== args2[i].type) return 0;

    return 1;
  }

  getSignatureAsString(){
    return `${this.type.name} ${this.name}(${this.args.map(arg => {
      return arg.type.name;
    }).join(', ')})`;
  }

  get isMethod(){ return 1; }

  get isRegular(){ return 0; }
  get isGetterOrSetter(){ return 0; }
  get isGetter(){ return 0; }
  get isSetter(){ return 0; }
  get isExternal(){ return 0; }
}

class RegularMethod extends Method{
  constructor(name, type, args, expr=null){
    super(name, type, args);
    this.expr = expr;
  }

  get isRegular(){ return 1; }
}

class GetterOrSetter extends Method{
  get isGetterOrSetter(){ return 1; }
}

class Getter extends GetterOrSetter{
  constructor(name, type){
    super(name, type, []);
  }

  get isGetter(){ return 1; }
}

class Setter extends GetterOrSetter{
  constructor(name, type){
    super(name, type, [new FormalArgument(name, type)]);
  }

  get isSetter(){ return 1; }
}

class ExternalMethod extends Method{
  constructor(name, type, args, func=null){
    super(name, type, args);
    this.func = func;
  }

  get isExternal(){ return 1; }
}

class FormalArgument extends Base{
  constructor(name, type){
    super();
    this.name = name;
    this.type = type;
  }
}

class Expression extends Base{
  type = null;

  iter(func){
    const stack = [this];

    while(stack.length !== 0){
      const expr = O.last(stack);

      if(!expr.isMethodCall){
        func(expr);
        stack.pop();
        continue;
      }

      if(expr.expr.type === null){
        stack.push(expr.expr);
        continue;
      }

      if(expr.mref === null){
        func(expr);
        const {args} = expr;
        for(let i = args.length - 1; i !== -1; i--)
          stack.push(args[i]);
        continue;
      }

      func(expr);
      stack.pop();
    }
  }

  get isThis(){ return 0; }
  get isSuper(){ return 0; }
  get isIdentifier(){ return 0; }
  get isInstantiation(){ return 0; }
  get isMethodCall(){ return 0; }
  get isInstance(){ return 0; }
}

class This extends Expression{
  get isThis(){ return 1; }
}

class Super extends Expression{
  get isSuper(){ return 1; }
}

class Identifier extends Expression{
  index = null;

  constructor(name){
    super();
    this.name = name;
  }

  get isIdentifier(){ return 1; }
}

class Instantiation extends Expression{
  constructor(cref){
    super();
    this.cref = cref;
  }

  get isInstantiation(){ return 1; }
}

class MethodCall extends Expression{
  mref = null;

  constructor(expr, mname, args){
    super();
    this.expr = expr;
    this.mname = mname;
    this.args = args;
  }

  get isMethodCall(){ return 1; }
}

class Instance extends Expression{
  constructor(cref){
    super();
    this.cref = cref;
    this.attribs = O.obj();
  }

  call(mname, args){
    const mcall = new MethodCall(this.cref.instantiate(), mname, args);
    const inv = new Invocation(mcall);
    const stack = [inv];

    const evaluate = expr => {
      if(expr.isThis){
        continue;
      }
    };

    while(stack.length !== 0){
      const inv = O.last(stack);
      const {mcall} = inv;

      if(inv.expr === null){
        evaluate(mcall.expr);
        continue;
      }
    }
  }

  get(name){
    const {attribs} = this;

    if(!(name in attribs))
      attribs[name] = new Instance(this.cref.attribs[name].type);

    return attribs[name];
  }

  set(name, val){
    this.attribs[name] = val;
  }

  get isInstance(){ return 1; }
}

class Invocation extends Base{
  expr = null;
  args = [];

  constructor(mcall){
    super();
    this.mcall = mcall;
  }
}

module.exports = {
  Base,
  Class,
  RegularClass,
  ExternalClass,
  ClassEntity,
  Attribute,
  Method,
  ExternalMethod,
  RegularMethod,
  GetterOrSetter,
  Getter,
  Setter,
  FormalArgument,
  Expression,
  Constant,
  This,
  Super,
  Identifier,
  Instantiation,
  MethodCall,
  Instance,
  Invocation,
};