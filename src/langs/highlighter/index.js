'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const parser = require('../../common/parser');
const Command = require('./command');

const run = (src, input) => {
  const parsedRules = parser.parseRules(src);
  const {rules, hlInfo} = parsedRules;
  const str = input.toString();

  const scopes = O.obj();
  const scopeInfoReg = /(#|[a-zA-Z0-9\-_]+(?:\s*,\s*[a-zA-Z0-9\-_]+)*)\s*:\s*(\S+)/g;

  for(const scopeInfo of O.exec(hlInfo.scopesInfo, scopeInfoReg)){
    const names = scopeInfo[1].split(/\s*\,\s*/);
    const color = parseColorInfo(scopeInfo[2]);

    for(const name of names){
      if(name in scopes)
        esolangs.err(`Duplicate definition of scope ${O.sf(name)}`);

      if(name === '#'){
        if(names.length !== 1)
          esolangs.err(`Definition for default scope cannot include other scopes`);

        if(color.includes(null))
          esolangs.err(`Default scope must define both foreground and background colors`);
      }

      scopes[name] = color;
    }
  }

  if(!('#' in scopes))
    esolangs.err(`Missing definition for default scope`);

  const defaultCol = scopes['#'];
  const ast = O.obj();

  for(const ruleName in rules){
    ast[ruleName] = e => {
      let cmd = new Command('arr', {
        arr: [...e].map(a => {
          if(a instanceof Command) return a;
          assert(typeof a === 'string');
          return new Command('str', a.length);
        }),
        index: 0,
      });

      if(!(ruleName in hlInfo.scopes)) return cmd;

      const scopeName = hlInfo.scopes[ruleName];

      if(!(scopeName in scopes))
        esolangs.err(`Undefined scope ${O.sf(scopeName)}`)

      scopes[scopeName].forEach((col, type) => {
        if(col === null) return;
        cmd = new Command('setCol', {type, col, cmd, oldCol: null});
      });

      return cmd;
    };
  }

  const parsed = parser.parse(parsedRules, str, ast);
  const stack = [parsed];

  const charCols = [];
  const curCol = defaultCol.slice();

  mainLoop: while(stack.length !== 0){
    const cmd = O.last(stack);
    assert(cmd instanceof Command);

    const {type, data} = cmd;

    switch(type){
      case 'str':
        for(let i = 0; i !== data; i++)
          charCols.push(curCol.slice());

        stack.pop();
        break;

      case 'arr':
        if(data.index !== data.arr.length){
          stack.push(data.arr[data.index++]);
          break;
        }

        stack.pop();
        break;

      case 'setCol':
        if(data.oldCol === null){
          data.oldCol = curCol[data.type];
          curCol[data.type] = data.col;
          stack.push(data.cmd);
          break;
        }

        curCol[data.type] = data.oldCol;
        stack.pop();
        break;

      default:
        assert.fail(type);
        break;
    }
  }

  assert(charCols.length === str.length);

  let output = `<div style="padding:12px;background:#272822;color:#f8f8f2;font-family:monospace;white-space:pre">`;
  let inSpan = 0;

  curCol[0] = defaultCol[0];
  curCol[1] = defaultCol[1];

  for(let i = 0; i !== str.length; i++){
    const char = str[i];
    const newCol = charCols[i];

    const dif = [
      /\S/.test(char) && newCol[0] !== curCol[0],
      newCol[1] !== curCol[1],
    ];

    if(dif.some(a => a)){
      if(inSpan){
        curCol[0] = defaultCol[0];
        curCol[1] = defaultCol[1];
        output += `</span>`;
        inSpan = 0;
        i--;
        continue;
      }

      let update = '';

      if(dif[0]) update += `color:#${curCol[0] = newCol[0]}`;
      if(dif[1]) update += `background:#${curCol[1] = newCol[1]}`;

      output += `<span style="${update}">`;
      inSpan = 1;
    }

    output += escape(char);
  }

  output += `</div>`;

  O.wfs('C:/users/thomas/downloads/1.htm', output);
  O.exit();

  return Buffer.from(output);
};

const parseColorInfo = str => {
  if(!str.includes('.'))
    return [parseColor(str), null];

  if(str.startsWith('.'))
    return [null, parseColor(str.slice(1))];

  if(str.endsWith('.'))
    return [parseColor(str.slice(1)), null];

  const cols = str.split('.');

  if(cols.length !== 2)
    esolangs.err(`Invalid color info ${O.sf(str)}`);

  return cols.map(a => parseColor(a));
};

const parseColor = str => {
  if(!/^[a-fA-F0-9]{6}$/.test(str))
    esolangs.err(`Invalid color ${O.sf(str)}`);

  return str.toLowerCase();
};

const escape = char => {
  if(/[a-zA-Z0-9]/.test(char)) return char;
  return `&#${O.cc(char)};`;
};

module.exports = run;