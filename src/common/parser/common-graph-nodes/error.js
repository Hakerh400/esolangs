'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../omikron');
const SG = require('../../serializable-graph');
const SF = require('../stack-frame');
const cgs = require('.');

const TAB_SIZE = 4;
const TAB = ' '.repeat(TAB_SIZE);
const LINE_SEP = '\n';
const DEFAULT_FUNC_NAME = '<anonymous>';

class Error extends SG.Node{
  static ptrsNum = this.keys(['message', 'stack', 'script']);
  static errName = 'Error';

  constructor(g, message=null){
    super(g);
    if(g.dsr) return;

    const {th} = g.intp;
    const {sf} = th;
    const funcs = th.getFuncs();
    const func = funcs.length !== 0 ? funcs[0] : null;
    const script = func !== null ? func.script : null;

    const hasData = sf !== null && script !== null;
    const lineNumber = hasData ? script.getLineNumber(sf.srcPos) : 1;
    const linePos = hasData ? script.getLinePos(sf.srcPos) : 1;

    const stackArr = [];
    let sfLast = sf;

    for(const func of funcs){
      const {script} = func;
      let scriptData = null;

      if(script !== null && script.fileName !== null){
        const {fileName} = script;
        const lineNumber = sfLast !== null ? script.getLineNumber(sfLast.srcPos) : 1;
        const linePos = sfLast !== null ? script.getLinePos(sfLast.srcPos) : 1;

        scriptData = `${fileName}:${lineNumber}:${linePos}`;
      }

      let {funcName} = func;
      if(funcName === null) funcName = DEFAULT_FUNC_NAME;

      stackArr.push(`${TAB}at ${funcName}${scriptData !== null ? ` (${scriptData})` : ''}`);
      sfLast = func.prev;
    }

    const stackStr = stackArr.join(LINE_SEP);
    const stack = new cgs.String(g, stackStr);

    if(typeof message === 'string')
      message = new cgs.String(g, message);

    this.message = message;
    this.stack = stack;
    this.script = script;
    this.lineNumber = lineNumber;
    this.linePos = linePos;
  }

  ser(s){
    super.ser(s);
    s.writeUint(this.lineNumber);
    s.writeUint(this.linePos);
  }

  deser(s){
    super.deser(s);
    this.lineNumber = s.readUint();
    this.linePos = s.readUint();
  }

  get name(){ return this.constructor.errName; }

  toString(){
    const {
      message,
      stack,
      script,
      lineNumber,
      linePos,
    } = this;

    let lines = [];

    if(script !== null){
      if(script.fileName !== null)
        lines.push(`${script.fileName}:${lineNumber}:${linePos}`);

      lines.push(script.getLine(lineNumber).trimEnd());
      lines.push('^'.padStart(linePos));
      lines.push('');
    }

    lines.push(`${this.name}${message !== null ? `: ${message}` : ''}`);
    lines.push(stack.str);

    return lines.join(LINE_SEP);
  }
}

module.exports = Error;