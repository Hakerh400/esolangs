'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

const AUX_OP_NAME = '[auxOp]';

const run = (src, input) => {
  src = src.toString();

  const io = new O.IOBit(input);

  const err = msg => {
    esolangs.err(`ERROR: ${msg}`);
  };

  src = src.replace(/\-\-.*?(?:[\r\n]|$)/gs, ' ');

  const defs = src.split(';');
  if(defs.length === 1) err('Expected at least one definition');
  if(/\S/.test(defs.pop())) err('Missing semicolon after the last definition');

  const ops = O.obj();
  const names = O.obj();
  const ids = O.obj();

  let mainOp = null;
  let idsNum = 0;

  const name2id = name => {
    if(name in ids) return ids[name];
    names[idsNum] = name;
    ids[name] = idsNum;
    return idsNum++;
  };

  const id2name = id => {
    return names[id];
  };

  const full = elem => {
    const type = elem[0];
    const num = elem.length - 1;

    if(type <= 2) return num === 1;
    if(type === 3) return num === 3;
    if(type <= 5) return num === 2;
    if(type === 6) return 1;

    if(num === 0) return 0;
    return num === ops[elem[1]].arity + 1;
  };

  for(const def of defs){
    const parts = def.trim().split(/\s*=\s*/);
    if(parts.length !== 2) err('Definition must have exactly one equals sign');

    const [operands, content] = parts;
    const opsData = operands.match(/^([a-zA-Z_][a-zA-Z0-9_]*)((?:\s+[a-zA-Z_][a-zA-Z0-9_]*)*)$/);
    if(opsData === null) err('Expected list of identifiers on the left side of the equals sign');

    const opId = name2id(opsData[1]);
    const opndsStr = opsData[2].trimLeft();
    const opnds = opndsStr !== '' ? opndsStr.split(/\s+/).map(a => name2id(a)) : [];
    const arity = opnds.length;

    if(content.trim() === '') err(`Missing definition for operator ${O.sf(id2name(opId))}`);
    if(opId in ops) err(`Duplicate definition of ${O.sf(id2name(opId))}`);

    ops[opId] = {
      id: opId,
      arity,
      opnds,
      content,
      elem: null,
    };

    if(mainOp === null){
      if(arity !== 1) err(`The main operator ${O.sf(id2name(opId))} must be unary`);
      mainOp = ops[opId];
    }
  }

  for(const opId in ops){
    const op = ops[opId];
    const {opnds, content} = op;

    const stack = [];

    const errOp = msg => {
      err(`${msg} while parsing ${O.sf(id2name(opId))}`);
    };

    const push = elem => {
      while(full(elem) && stack.length !== 0){
        const last = O.last(stack);

        if(full(last))
          errOp(`Too many operands for operator ${O.sf(elem2str(last))}`);

        last.push(elem);
        elem = stack.pop();
      }

      stack.push(elem);
    };

    const elem2str = elem => {
      const type = elem[0];
      if(type <= 5) return '01.?+-'[type];
      return id2name(type === 6 ? opnds[elem[1]] : elem[1]);
    };

    O.tokenize(content, [
      /\s+/, O.nop,

      /[01\.\?\+\-]/, (str, gs) => {
        push(['01.?+-'.indexOf(str)]);
      },

      /[a-zA-Z_][a-zA-Z0-9_]*/, (str, gs) => {
        const id = name2id(str);
        const argIndex = opnds.indexOf(id);

        if(argIndex !== -1)
          return push([6, argIndex]);

        if(!(id in ops)) errOp(`Undefined operator ${O.sf(str)}`);
        return push([7, id]);
      },

      (str, gs) => {
        errOp(`Invalid token ${O.sf(str)}`);
      },
    ]);

    if(stack.length !== 1 || !full(O.last(stack)))
      errOp(`Not enough operands for operator ${O.sf(elem2str(O.last(stack)))}`);

    op.elem = stack[0];
  }

  let outFlag = 1;

  const prepareInput = () => {
    const auxOpId = name2id(AUX_OP_NAME);

    ops[auxOpId] = {
      id: auxOpId,
      arity: 0,
      opnds: [],
      content: AUX_OP_NAME,
      elem: [0, [7, auxOpId]],
    };

    const first = [];
    let elem = first;

    while(io.read())
      elem.push(1, [io.read(), elem = []]);

    elem.push(7, auxOpId);
    return first;
  };

  const out = bit => {
    if(outFlag){
      if(!bit) return 0;
      outFlag = 0;
      return 1;
    }

    io.write(bit);
    outFlag = 1;

    return 1;
  };

  const stack = [];
  let elem = [7, mainOp.id, prepareInput()];
  let last = null;

  while(1){
    const type = elem[0];

    if(type <= 1){
      if(last === null){
        if(!out(type)) break;
        elem = elem[1];
        continue;
      }

      last = stack.pop();

      switch(last[0]){
        case 2: elem = elem[1]; break;
        case 3: elem = type ? last[2] : last[3]; break;
        case 4: elem = [type, last[2]]; break;
        case 5: elem = [type ^ 1, last[2]]; break;
      }

      last = O.last(stack);
      continue;
    }

    if(type !== 7){
      stack.push(elem);
      last = elem;
      elem = elem[1];
      continue;
    }

    subst: {
      const elemOld = elem;
      const elemNew = ops[elemOld[1]].elem.slice();
      const stack = [elemNew];

      if(elemNew[0] === 6){
        elem = elemOld[elemNew[1] + 2];
        break subst;
      }

      while(stack.length !== 0){
        const elem = stack.pop();
        const type = elem[0];
        let e;

        if(type !== 7){
          e = elem[1];
          if(e[0] === 6) elem[1] = elemOld[e[1] + 2];
          else stack.push(elem[1] = e.slice());

          if(type >= 3){
            e = elem[2];
            if(e[0] === 6) elem[2] = elemOld[e[1] + 2];
            else stack.push(elem[2] = e.slice());

            if(type === 3){
              e = elem[3];
              if(e[0] === 6) elem[3] = elemOld[e[1] + 2];
              else stack.push(elem[3] = e.slice());
            }
          }

          continue;
        }

        for(let i = 2; i !== elem.length; i++){
          e = elem[i];
          if(e[0] === 6) elem[i] = elemOld[e[1] + 2];
          else stack.push(elem[i] = e.slice());
        }
      }

      elem = elemNew;
    }
  }

  return io.getOutput();
};

module.exports = run;