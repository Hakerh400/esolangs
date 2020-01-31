'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

const MAIN_CLASS = 'Main';

class Engine{
  constructor(parsed, input){
    this.parsed = parsed;
    this.input = input;
    this.output = null;
  }

  run(){
    const {parsed, input} = this;
    const io = new O.IO(input);

    const crefs = O.obj();

    // Replace class names with references
    for(const cref of parsed){
      const {name} = cref;

      if(name in crefs)
        esolangs.err(`Redefinition of class ${O.sf(name)}`);

      crefs[name] = cref;
    }

    // Replace extended class names with references
    for(const cref of parsed){
      const {name, extName} = cref;

      if(extName !== null && !(extName in crefs))
        esolangs.err(`Cannot extend undefined class ${O.sf(extName)}`);

      cref.ext = extName !== null ? crefs[extName] : null;
    }

    // Sanitize attributes and methods
    for(const cref of parsed){
      if(cref.isExternal) continue;
      const {ents, attribs, methods, getters, setters} = cref;

      for(const ent of ents){
        const {name} = ent;

        if(!(ent.type in crefs))
          esolangs.err(`Undefined class ${O.sf(ent.type)} as the return value of method ${O.sf(name)} from class ${O.sf(cref.name)}`);

        ent.type = crefs[ent.type];
        const type = ent.type;

        if(name in attribs || name in methods)
          esolangs.err(`Redefinition of attribute or method ${O.sf(name)}`);

        if(ent.isAttrib){
          attribs[name] = ent;
          getters[name] = new cs.Getter(name, ent.type);
          setters[name] = new cs.Setter(name, ent.type);
        }else{
          for(const arg of ent.args){
            const {type} = arg;
            if(!(type in crefs))
              esolangs.err(`Undefined class ${O.sf(type)} in formal argument at method ${O.sf(name)} from class ${O.sf(cref.name)}`);
            arg.type = crefs[type];
          }

          methods[name] = ent;
        }
      }
    }

    // Check if there are circular prototype chains
    const protoChainVisited = new Set();
    for(const cref of parsed){
      if(protoChainVisited.has(cref)) continue;

      const seen = new Set([cref]);
      let c = cref;

      while(c.ext !== null){
        protoChainVisited.add(c);
        c = c.ext;
        if(seen.has(c))
          esolangs.err(`Class ${O.sf(c.name)} has circular prototype chain`);
        seen.add(c);
      }
    }

    // Enumerate polymorphically redefined methods
    // Define implicit getter and setters for each attribute
    protoChainVisited.clear();
    for(const cref of parsed){
      if(protoChainVisited.has(cref)) continue;

      const original = cref;
      const chain = cref.getProtoChain();

      for(let i = chain.length - 1; i !== -1; i--){
        const cref = chain[i];
        if(protoChainVisited.has(cref)) continue;
        protoChainVisited.add(cref);

        const {ext} = cref;
        if(ext === null) continue;

        for(const attribName in ext.attribs){
          const attrib = ext.attribs[attribName];
          const {name} = attrib;

          if(name in cref.attribs || name in cref.methods)
            esolangs.err(`Class ${
              O.sf(cref.name)} defines ${
              name in cref.attribs ? 'attribute' : 'method'} ${
              O.sf(name)}, but it also extends (directly or indirectly) class ${
              O.sf(ext.name)} which defines an attribute with the same name`);

          cref.attribs[name] = attrib;
          cref.getters[name] = ext.getters[name];
          cref.setters[name] = ext.setters[name];
        }

        for(const methodName in ext.methods){
          const method = ext.methods[methodName];
          const {name} = method;

          if(name in cref.attribs)
            esolangs.err(`Class ${
              O.sf(cref.name)} defines attribute ${
              O.sf(name)}, but it also extends (directly or indirectly) class ${
              O.sf(ext.name)} which defines a method with the same name`);

          if(!(name in cref.methods)){
            cref.methods[name] = method;
            continue;
          }

          if(!method.sameSignature(cref.methods[name]))
            esolangs.err(`Class ${
              O.sf(cref.name)} defines method ${
              O.sf(name)}, but it also extends (directly or indirectly) class ${
              O.sf(ext.name)} which defines a method with the same name, but with different signature`);
        }
      }
    }

    const getCref = (name, mode=null) => {
      if(!(name in crefs))
        esolangs.err(`Missing definition for class ${O.sf(name)}`);

      const cref = crefs[name];

      if(mode === 0){
        if(cref.isExternal) esolangs.err(`Class ${O.sf(name)} cannot be external`);
      }else if(mode === 1){
        if(!cref.isExternal) esolangs.err(`Class ${O.sf(name)} must be external`);
      }

      return cref;
    };

    const regularClasses = O.arr2obj([getCref(MAIN_CLASS, 0)]);

    const regularMethods = {
      [MAIN_CLASS]: {
        in0: new cs.RegularMethod('in0', getCref(MAIN_CLASS), []),
        in1: new cs.RegularMethod('in1', getCref(MAIN_CLASS), []),
        out: new cs.RegularMethod('out', getCref(MAIN_CLASS), []),
      },
    };

    const externalClasses = O.arr2obj([]);

    const externalMethods = {
      [MAIN_CLASS]: {
        out0: new cs.ExternalMethod('out0', getCref(MAIN_CLASS), [], () => io.write(0)),
        out1: new cs.ExternalMethod('out1', getCref(MAIN_CLASS), [], () => io.write(1)),
      },
    };

    // Sanitize method expressions
    const processedMethods = new Set();
    for(const cref of parsed){
      if(cref.isExternal){
        if(!(cref.name in externalClasses))
          esolangs.err(`Class ${O.sf(cref.name)} is declared as external, but there is no external class with that name`);
        continue;
      }

      const {methods} = cref;

      for(const methodName in methods){
        const method = methods[methodName];
        if(processedMethods.has(method)) continue;
        processedMethods.add(method);

        const err = msg => {
          esolangs.err(`In class ${O.sf(cref.name)}, method ${O.sf(methodName)}: ${msg}`);
        };

        if(method.isExternal){
          if(!(cref.name in externalMethods && method.name in externalMethods[cref.name]))
            err(`The method is declared as external, but there is no external method with that name for that class`);

          const extm = externalMethods[cref.name][method.name];
          if(!method.sameSignature(extm))
            err(`The method must have signature ${O.sf(extm.getSignatureAsString())}`);

          method.func = extm.func;
          continue;
        }

        const {args, expr} = method;

        expr.iter(expr => {
          if(expr.isThis){
            expr.type = cref;
            return;
          }

          if(expr.isSuper){
            if(cref.ext === null)
              err('Cannot use "super" keyword because the class does not extend any other class');

            expr.type = cref.ext;
            return;
          }

          if(expr.isIdentifier){
            const {name} = expr;
            const index = args.findIndex(arg => arg.name === name);
            if(index === -1) err(`Identifier ${O.sf(name)} is not defined`);
            expr.index = index;
            expr.type = args[index].type;
            return;
          }

          if(expr.isInstantiation){
            const name = expr.cref;
            if(!(name in crefs)) err(`Cannot instantiate undefined class ${O.sf(name)}`);

            const cref = crefs[name];
            expr.cref = cref;
            expr.type = cref;
            return;
          }

          if(expr.mref === null){
            const cref = expr.expr.type;
            const {mname} = expr;
            const {methods} = cref;

            let mref;

            if(!(mname in methods)){
              if(!(mname in cref.attribs))
                err(`Class ${O.sf(cref.name)} has no method ${O.sf(mname)}`);
              mref = expr.args.length === 1 ? cref.setters[mname] : cref.getters[mname];
            }else{
              mref = methods[mname];
            }

            if(expr.args.length !== mref.args.length)
              err(`Method ${O.sf(mname)} of class ${O.sf(cref.name)} takes ${mref.args.length} arguments, but got ${expr.args.length}`);

            expr.mref = mref;
            return;
          }

          {
            const {mref, args} = expr;

            args.forEach((arg, index) => {
              const expected = mref.args[index].type;
              if(!arg.type.extends(expected))
                err(`Argument with index ${index} at method ${
                  O.sf(mref.name)} from class ${
                  O.sf(expr.expr.type.name)} must be of type ${
                  O.sf(expected.name)} (or an extended type), but got ${
                  O.sf(arg.type.name)}`);
            });

            expr.type = mref.type;
          }
        });
      }
    }

    // Ensure that all regular methods are defined
    for(const cname in regularMethods){
      const regms = regularMethods[cname];
      const cref = getCref(cname);

      if(cref.isExternal)
        esolangs.err(`Class ${O.sf(cname)} cannot be external`);

      for(const mname in regms){
        if(!(mname in cref.methods))
          esolangs.err(`Class ${O.sf(cname)} must define method ${O.sf(mname)}`);

        const method = cref.methods[mname];
        if(method.isExternal)
          esolangs.err(`Method ${O.sf(mname)} from class ${O.sf(cname)} cannot be external`);

        const regm = regms[mname];
        if(!method.sameSignature(regm))
          esolangs.err(`Method ${O.sf(mname)} from class ${O.sf(cname)} must have signature ${O.sf(regm.getSignatureAsString())}`);
      }
    }

    // Ensure that all external methods are declared
    for(const cname in externalMethods){
      const extms = externalMethods[cname];
      const cref = getCref(cname);

      if(cref.isExternal)
        esolangs.err(`Class ${O.sf(cname)} cannot be external`);

      for(const mname in extms){
        if(!(mname in cref.methods))
          esolangs.err(`Class ${O.sf(cname)} must declare external method ${O.sf(mname)}`);

        const method = cref.methods[mname];
        if(!method.isExternal)
          esolangs.err(`Method ${O.sf(mname)} from class ${O.sf(cname)} must be external`);
      }
    }

    // Start of the program execution
    {
      const main = crefs[MAIN_CLASS].instantiate();

      while(io.hasMore){
        if(io.read()) main.call('in1', []);
        else main.call('in0', []);
      }

      main.call('out', []);
    }

    this.output = io.getOutput();
  }
  
  getOutput(){
    return this.output;
  }
}

module.exports = Engine;