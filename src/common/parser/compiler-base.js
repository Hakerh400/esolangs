'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const SG = require('../serializable-graph');
const SF = require('./stack-frame');
const cgs = require('./common-graph-nodes');
const AST = require('./ast');

const {ASTNode, ASTDef, ASTPat, ASTElem, ASTNterm, ASTTerm} = AST;

class CompilerBase extends SF{
  static ptrsNum = this.keys(['ast']);

  constructor(g, ast){
    super(g);
    if(g.dsr) return;

    this.ast = ast;
    g.stage = 1;
  }

  tick(th){
    const {g} = this;

    if(this.i++ === 0) return th.call(new CompileDef(g, this, this.ast.node));

    g.setRetVal(this.rval);
    th.ret(cgs.Null.get(g));
    g.stage = 2;
  }
}

class Compile extends SF{
  static ptrsNum = this.keys(['compiler', 'elem']);

  constructor(g, compiler, elem){
    super(g);
    if(g.dsr) return;

    this.compiler = compiler;
    this.elem = elem;
  }
}

class CompileDef extends Compile{
  constructor(g, compiler, elem){
    super(g, compiler, elem);
    if(g.dsr) return;
  }

  tick(th){
    const {g, compiler, elem: def} = this;
    const name = def.ref.name;

    const funcName = `[${name}]`;
    if(!(funcName in compiler))
      throw new TypeError(`Missing implementation for syntax rule ${O.sf(name)}`);

    const func = compiler[funcName];

    if(this.nval)
      return th.call(new CompileArr(g, compiler, def.pat.elems));

    def.pat.elems = this.rval;
    this.rval = null;

    const compiled = func.call(compiler, def, th);
    if(compiled instanceof SF) compiled.srcPos = def.index;
    if(th.sf === this) th.ret(compiled);
  }
}

class CompileArr extends Compile{
  constructor(g, compiler, elem){
    super(g, compiler, elem);
    if(g.dsr) return;
  }

  tick(th){
    const {g, compiler, elem: arr} = this;

    if(this.i === arr.length)
      return th.ret(arr);

    const elem = arr[this.i];

    switch(this.j){
      case 0:
        if(elem instanceof ASTElem){
          if(this.nval)
            return th.call(new CompileArr(g, compiler, elem.arr));

          elem.arr = this.rval;
          this.rval = null;
        }

        this.j = 1;
        break;

      case 1:
        if(elem instanceof ASTElem){
          if(this.nval)
            return th.call(new CompileArr(g, compiler, elem.seps));

          elem.seps = this.rval.map(a => a.fst);
          this.rval = null;
        }

        this.j = 2;
        break;

      case 2:
        if(elem instanceof ASTDef){
          if(this.nval)
            return th.call(new CompileDef(g, compiler, elem));

          arr[this.i] = this.rval;
          this.rval = null;
        }else{
          arr[this.i] = elem;
        }

        this.i++;
        this.j = 0;
        break;
    }
  }
}

module.exports = Object.assign(CompilerBase, {
  Compile,
  CompileDef,
  CompileArr,
});