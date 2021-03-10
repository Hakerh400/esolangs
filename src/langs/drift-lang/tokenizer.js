'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');

const tokTypes = O.enum([
  'EQ',
  'COLON',
  'STAR',
  'OPEN_PAREN',
  'CLOSED_PAREN',
  'VAR',
  'TYPE',
]);

const tt = tokTypes;

const tokChars = '=:*()';
const tokCharsReg = new RegExp(`[${tokChars.replace(/./gs, a => `\\${a}`)}]`);

const tokenize = function*(str, func){
  const lines = O.sanl(str).map(line => {
    const commentIndex = line.indexOf('--');

    if(commentIndex !== -1)
      line = line.slice(0, commentIndex);

    line = line.trimRight();

    return line;
  }).filter(line => {
    return line.length !== 0;
  });

  if(lines.length === 0)
    err(`Empty source code`);

  let spaces = null;

  const errSpacesTabs = () => {
    err(`Use either space or tab as indentation character, not both`);
  };

  const indents = lines.map(line => {
    const indent = line.match(/^\s*/)[0];

    if(indent.length === 0)
      return 0;

    if(/^ +$/.test(indent)){
      if(spaces === 0) errSpacesTabs();
      spaces = 1;
      return indent.length;
    }

    if(/^\t+$/.test(indent)){
      if(spaces === 1) errSpacesTabs();
      spaces = 0;
      return indent.length;
    }

    const badChar = indent.match(/[^ \t]/)[0];

    err(`Whitespace character 0x${
      O.hex(O.cc(badChar), 1)} is not a valid indentation character`);
  });

  if(indents[0] !== 0)
    err(`The first line may not be indented`);

  const normalizeLine = line => {
    return line.trim().replace(/\s+/g, ' ');
  };

  const tokenize = str => {
    const toks = [];

    const push = (...arr) => {
      for(const tok of arr){
        assert(tok !== undefined);

        if(typeof tok === 'number')
          assert(O.has(tokTypes, tok))

        toks.push(tok);
      }
    };

    O.tokenize(str, [
      tokCharsReg, a => {
        push(tokChars.indexOf(a));
      },

      /(\&?)([a-z][a-zA-Z0-9\.\-\_]*)/, (a, [b, c]) => {
        const type = b.length === 1 ? tt.TYPE : tt.VAR;
        push(type, c);
      },

      /\~|[A-Z0-9\.\-\_]+[a-zA-Z0-9\.\-\_]*/, a => {
        push(tt.TYPE, a);
      },

      /\s+/, O.nop,

      a => {
        err(`Invalid syntax near\n\n${a}`);
      },
    ]);

    return toks;
  };

  const linesNum = lines.length;
  const indentsStack = [0];
  let isLabel = 0;

  for(let i = 0; i !== linesNum; i++){
    const levelPrev = indentsStack.length;
    const lastIndent = O.last(indentsStack);
    const indent = indents[i];

    let line = lines[i];

    if(indent > lastIndent){
      indentsStack.push(indent);
    }else if(indent < lastIndent){
      while(1){
        const currentIndent = O.last(indentsStack);
        if(currentIndent === indent) break;

        if(currentIndent < indent)
          err(`Indentation error on line\n\n${normalizeLine(line)}`);
        
        indentsStack.pop();
      }
    }

    const levelDif = indentsStack.length - levelPrev;

    if(levelDif > 0){
      assert(levelDif === 1);
      assert(isLabel);
    }

    const popLevel = isLabel - levelDif;

    isLabel = line.endsWith(':');

    if(!isLabel)
      while(i !== linesNum - 1 && indents[i + 1] > indent)
        line += lines[++i];

    line = normalizeLine(line);

    const toks = tokenize(line);
    assert(toks.length !== 0);

    yield {line, toks, isLabel, popLevel};
  }
};

const tok2str = tok => {
  return toks2str([tok]);
};

const toks2str = toks => {
  return toks.map(tok => {
    if(typeof tok === 'string') return tok;

    assert(typeof tok === 'number');

    if(tok < tokChars.length)
      return tokChars[tok];

    return null;
  }).filter(a => a !== null).join(' ');
};

const toksLen = toks => {
  let len = 0;

  for(const tok of toks)
    if(typeof tok === 'number')
      len++;

  return len;
};

const err = msg => {
  esolangs.err(`Syntax error: ${msg}`);
};

module.exports = {
  tokTypes,
  tokenize,
  tok2str,
  toks2str,
  toksLen,
  err,
};