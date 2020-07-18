'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');
const cs = require('./ctors');

const EXECUTE = 1;
const SHOW_INFO = 0;
const RETURN_OUTPUT = !SHOW_INFO;

const SHOW_SRC_AFTER_IDENT_SUBST = SHOW_INFO;
const SHOW_SRC_AFTER_INST_PARSE = SHOW_INFO;
const SHOW_ROOT_AFTER_END = SHOW_INFO;

const SHOW_SRC_MIN = 0;

const run = (src, input) => {
  let main = null;
  let output = '';

  // Parse the source code
  {
    const identsInfo = O.obj();

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
          ident = '\\';
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

    if(SHOW_SRC_MIN){
      const elems = main.elems;
      let index = 0;

      while(index <= elems.length - 3 && elems[index].len === 0 && elems[index + 1].len === 0)
        index += 3;

      log(`${O.match(elems.slice(index).join(''), /.{100}|.+/gs).join('\n')}\n`);
    }

    if(SHOW_SRC_AFTER_IDENT_SUBST)
      log(`${main}\n`);

    // Parse instructions
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

    if(SHOW_SRC_AFTER_INST_PARSE)
      log(`${main}\n`);
  }

  if(!EXECUTE)
    O.exit();

  // Program execution
  {
    let inputPtr = 0;
    let inputOdd = 1;

    const read = () => {
      if(inputPtr === input.length)
        return 0;

      if(inputOdd){
        inputOdd = 0;
        return 1;
      }

      inputOdd = 1;
      return input[inputPtr++] | 0;
    };

    const write = bit => {
      output += bit | 0;
    };

    const stack = [main];
    const rootContainer = new cs.Object();

    const getRoot = () => {
      return rootContainer.get(rootContainer);
    };

    const getRef = (addr, asRef=1) => {
      const {elems} = addr;
      const root = getRoot();

      if(elems.length === 0){
        if(asRef)
          return [rootContainer, rootContainer];

        return root;
      }

      const stack = [[root, elems, 0]];
      let target = null;

      while(1){
        const frame = O.last(stack);
        const [obj, elems, ptr] = frame;
        const len = elems.length;

        if(asRef && stack.length === 1 && ptr === len - 1){
          target = obj;
          asRef = 0;

          stack.pop();
          stack.push([root, elems[ptr].elems, 0]);

          continue;
        }

        if(ptr === len){
          if(stack.length === 1){
            if(target !== null)
              return [target, obj];

            return obj;
          }

          stack.pop();
          const prev = O.last(stack);
          prev[0] = prev[0].get(obj);

          continue;
        }

        const elemsNew = elems[ptr].elems;
        frame[2]++;

        if(elemsNew.length === 0){
          frame[0] = frame[0].get(root);
          continue;
        }

        stack.push([root, elemsNew, 0]);
      }
    };

    const getVal = addr => {
      return getRef(addr, 0);
    };

    // The main loop
    while(stack.length !== 0){
      const block = O.last(stack);
      const {insts, ip} = block;

      if(ip === insts.length){
        stack.pop();
        continue;
      }

      const inst = insts[ip];
      const {addr1, addr2} = inst;

      if(inst instanceof cs.Assignment){
        const [obj, key] = getRef(addr1);
        obj.set(key, getVal(addr2));
        block.ip++;
        continue;
      }

      if(inst instanceof cs.Input){
        if(read()){
          const [obj, key] = getRef(addr1);
          obj.set(key, getVal(addr2));
        }
        block.ip++;
        continue;
      }

      if(inst instanceof cs.Output){
        write(getVal(addr1) === getVal(addr2));
        block.ip++;
        continue;
      }

      if(inst instanceof cs.Loop){
        if(getVal(addr1) !== getVal(addr2)){
          block.ip++;
          continue;
        }
        const instBlock = inst.block;
        instBlock.ip = 0;
        stack.push(instBlock);
        continue;
      }

      assert.fail(inst);
    }

    if(SHOW_ROOT_AFTER_END)
      log(`${getRoot()}\n`);
  }

  if(!RETURN_OUTPUT)
    O.exit();

  return Buffer.from(output);
};

module.exports = run;