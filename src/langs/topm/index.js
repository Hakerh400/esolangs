'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

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

        assert(ident in identsInfo, O.sf(ident));

        const info = identsInfo[ident];
        if(info instanceof cs.List) return info;

        seen[ident] = 1;
        ident = info.name;
      }
    };

    const toList = elem => {
      if(elem instanceof cs.List) return elem;
      return getIdentInfo(elem);
    };

    // Parse the main element
    {
      const stack = [new cs.List()];
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

        append(new cs.Identifier(ident));

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
          stack.push(new cs.List());
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

          if(elem instanceof cs.List){
            stack.push([elem.elems, seen]);
            continue;
          }

          const {name} = elem;

          if(name in seen)
            errCycl(name);

          const elemNew = getIdentInfo(name).slice();
          const seenNew = O.nproto(seen);
          seenNew[name] = 1;

          elems[i] = elemNew;
          stack.push([elemNew.elems, seenNew]);
        }
      }
    }

    // Obtain instructions
    {
      const mainBlock = new cs.CodeBlock();
      const stack = [[mainBlock, main.elems]];

      while(stack.length !== 0){
        const [block, elems] = stack.pop();

        // Reverse elements to avoid quadratic time complexity
        const elemsArr = elems.slice().reverse();

        const next = () => {
          if(elemsArr.length !== 0)
            return elemsArr.pop();

          return new cs.List();
        };

        while(elemsArr.length !== 0){
          const elem = next();
          const {elems} = elem;

          // Assignment
          if(elem.len === 0){
            block.push(new cs.Assignment(next(), next()));
            continue;
          }

          // Input
          if(elem.len === 1 && elems[0].len === 0){
            block.push(new cs.Input(next(), next()));
            continue;
          }

          // Output
          if(elem.len === 1 && elems[0].len === 1 && elems[0].elems[0].len === 0){
            block.push(new cs.Output(next(), next()));
            continue;
          }

          // Loop
          if(elem.len === 2 && elems[0].len === 0 && elems[1].len === 0){
            const loop = new cs.Loop(next(), next());
            block.push(loop);
            stack.push([loop.block, next().elems]);
            continue;
          }

          // Compressed instruction

          for(let i = 0; i !== 2; i++)
            for(let i = elems.length - 1; i !== -1; i--)
              elemsArr.push(elems[i]);
        }
      }

      main = mainBlock;
    }

    log(main.toString());
  }

  O.exit();
};

module.exports = run;