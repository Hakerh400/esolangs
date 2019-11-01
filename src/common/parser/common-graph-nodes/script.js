'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../omikron');
const SG = require('../../serializable-graph');
const SF = require('../stack-frame');
const cgs = require('.');

class Script extends SG.Node{
  static ptrsNum = this.keys(['source', 'fileName']);

  constructor(g, source=null, fileName=null){
    super(g);
    if(g.dsr) return;

    this.source = source;
    this.fileName = fileName;
  }

  // TODO: reduce duplication
  getLine(lineNum){
    const {str} = this.source;
    const lines = str.match(/.*?(?:\r\n|\r|\n)|.+/gs) || [];
    return lineNum <= lines.length ? lines[lineNum - 1] : '';
  }

  getLineNumber(pos){
    const {str} = this.source;
    const lines = str.match(/.*?(?:\r\n|\r|\n)|.+/gs) || [];

    let lineNum = 0;

    for(const line of lines){
      if(pos < line.length) break;
      lineNum++;
      pos -= line.length;
    }

    return lineNum + 1;
  }

  getLinePos(pos){
    const {str} = this.source;
    const lines = str.match(/.*?(?:\r\n|\r|\n)|.+/gs) || [];

    let lineNum = 0;

    for(const line of lines){
      if(pos < line.length) break;
      lineNum++;
      pos -= line.length;
    }

    return pos + 1;
  }
}

module.exports = Script;