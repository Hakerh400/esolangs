'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const SG = require('../serializable-graph');
const SF = require('./stack-frame');
const Rule = require('./rule');
const Section = require('./section');
const Pattern = require('./pattern');
const Element = require('./element');
const Range = require('./range');
const Context = require('./context');
const AST = require('./ast');
const cgs = require('./common-graph-nodes');

const MAIN_DEF = 'script';

const {ASTNode, ASTDef, ASTPat, ASTElem, ASTNterm, ASTTerm} = AST;

class ParserBase extends SF{
  static ptrsNum = this.keys(['ast', 'cache', 'parsing', 'sfDef']);

  constructor(g, script, exec=0){
    super(g);
    if(g.dsr) return;

    const {syntax} = g.lang;

    this.ast = new AST(g, syntax, script.source);
    this.cache = [];
    this.parsing = [];
    this.sfDef = new ParseDef(g, this, 0, syntax.defs[MAIN_DEF]['*']);
    this.exec = exec;

    g.stage = 0;
  }

  ser(s){ super.ser(s); s.write(this.exec); }
  deser(s){ super.deser(s); this.exec = s.read(); }

  tick(th){
    const {g, ast} = this;
    if(this.i++ === 0) return th.call(this.sfDef);

    const node = this.rval;
    if(node.len !== ast.str.length){

      this.srcPos = this.cache.reduce((pos, map) => {
        if(map === null) return pos;

        for(const val of map.values())
          pos = Math.max(val.end, pos);

        return pos;
      }, 0);

      return th.throw(new cgs.SyntaxError(g, 'Invalid syntax'));
    }

    ast.node = node;
    if(!this.exec) return th.ret(ast);
    th.call(new this.constructor.Compiler(this.g, ast), 1);
  }

  createNewNode(index, ref, addToCache=1){
    const {g, ast, cache} = this;
    let ctor;

    if(ref instanceof Rule){
      ctor = ASTDef;
    }else if(ref instanceof Pattern){
      ctor = ASTPat;
    }else if(ref instanceof Element){
      if(ref instanceof Element.NonTerminal){
        ctor = ASTNterm;
      }else if(ref instanceof Element.Terminal){
        ctor = ASTTerm;
      }
    }

    const node = new ctor(g, ast, index, ref);
    if(index > ast.str.length)
      throw new RangeError('Cache array out of bounds');

    if(addToCache)
      this.prepareCacheIndex(index).set(ref, node);

    return node;
  }

  getNodeFromCache(index, ref, force=0){
    const map = this.prepareCacheIndex(index);
    if(map.has(ref)) return map.get(ref);
    if(!force) return null;
    return this.createNewNode(index, ref);
  }

  prepareCacheIndex(index){
    const {g, cache} = this;
    if(index >= cache.length)
      while(cache.length <= index)
        cache.push(null);
    if(cache[index] === null) cache[index] = new Map();
    return cache[index];
  }

  prepareParsingIndex(index){
    const {g, parsing} = this;
    if(index >= parsing.length)
      while(parsing.length <= index)
        parsing.push(null);
    if(parsing[index] === null) parsing[index] = new Set();
    return parsing[index];
  }
}

class Parse extends SF{
  static ptrsNum = this.keys(['parser', 'ref', 'node']);

  constructor(g, parser, index=0, ref=null){
    super(g);
    if(g.dsr) return;

    this.parser = parser;
    this.ref = ref;
    this.node = null;
    this.index = index;
  }

  ser(s){ super.ser(s); s.writeUint(this.index); }
  deser(s){ super.deser(s); this.index = s.readUint(); }
}

class ParseDef extends Parse{
  static ptrsNum = this.keys(['nodePrev']);

  constructor(g, parser, index, ref){
    super(g, parser, index, ref);
    if(g.dsr) return;

    this.nodePrev = null;
  }

  tick(th){
    const {g, parser, index, ref: def} = this;
    const {str} = parser.ast;
    const pSet = parser.prepareParsingIndex(index);

    if(this.node === null){
      let node = parser.getNodeFromCache(index, def);
      if(node !== null && (node.done || pSet.has(def)))
        return th.ret(node);

      pSet.add(def);
      this.node = node;
      this.i = -1;
    }

    const pats = def.sects.include.pats;
    let {node, nodePrev: prev} = this;

    if(this.i === -1){
      this.nodePrev = prev = node;
      this.node = node = parser.createNewNode(index, def, node === null);
      this.i = 0;
    }else if(this.i === pats.length){
      node.update();

      if(prev !== null && node.len <= prev.len){
        this.node = node = prev;
        pSet.delete(def);

        return th.ret(node);
      }

      parser.cache[index].set(def, node);
      this.i = -1;
    }else{
      if(this.nval)
        return th.call(new ParsePat(g, parser, index, pats[this.i]));

      this.i++;
      node.pats.push(this.rval);
      this.rval = null;
    }
  }
}

class ParsePat extends Parse{
  constructor(g, parser, index, ref){
    super(g, parser, index, ref);
    if(g.dsr) return;
  }

  tick(th){
    const {g, parser, index, ref: pat} = this;
    const {str} = parser.ast;

    if(this.node === null){
      let node = parser.getNodeFromCache(index, pat, 1);
      if(node.done) return th.ret(node);
      node = parser.createNewNode(index, pat);

      this.node = node;
    }

    const {elems} = pat;
    const {node} = this;
    const {indices, lens} = node;

    if(this.nval)
      return th.call(new ParseElem(g, parser, index, elems[this.i]));

    const elem = this.rval;
    this.rval = null;

    if(elem.len === -1){
      node.elems.pop();

      let iPrev = this.i;

      while(--iPrev !== -1){
        const elem = elems[iPrev];
        if(elem.greediness === 0){
          const len = lens[iPrev] + 1;
          if(!elem.range.has(len)) continue;

          this.i = iPrev;
          this.index = indices[iPrev];

          node.elems.length = iPrev;
          indices.length = iPrev;
          lens.length = iPrev;

          return th.call(new ParseElem(g, parser, this.index, elem, len));
        }
      }

      return th.ret(node.reset());
    }

    node.elems.push(elem);
    indices.push(this.index);
    lens.push(elem.getLen());

    this.i++;
    this.index += elem.len;
    if(this.i === elems.length) th.ret(node.update());
  }
}

class ParseElem extends Parse{
  constructor(g, parser, index, ref, targetLen=ref.range.start){
    super(g, parser, index, ref);
    if(g.dsr) return;

    this.targetLen = targetLen;
  }

  tick(th){
    const {g, parser, index, targetLen, ref: elem} = this;
    const {str} = parser.ast;

    const gr = elem.greediness === 1;
    const ng = elem.greediness === 0;

    if(this.node === null){
      if(gr){
        let node = parser.getNodeFromCache(index, elem, 1);
        if(node.done) return th.ret(node);
      }

      let node = parser.createNewNode(index, elem);
      this.node = node;
    }

    const lenMin = gr ? elem.range.start : targetLen;
    const lenMax = gr ? elem.range.end : targetLen;
    let {node} = this;

    const done = () => {
      th.ret(
        node.getLen() >= lenMin ?
        node.update() :
        node.reset()
      );
    };

    if(node.arr.length === lenMax) return done();

    if(this.i === 0){
      if(elem.sep !== null && node.arr.length !== 0){
        if(this.nval)
          return th.call(new ParseElem(g, parser, index, elem.sep));

        const sep = this.rval;
        this.rval = null;

        if(sep.len === -1) return done();
        node.seps.push(sep);
        this.index += sep.len;
      }

      this.i = 1;
    }else{
      if(node instanceof ASTNterm){
        if(!node.ref.ruleRange.isAny())
          O.exit(node.ref.rule);

        if(this.nval)
          return th.call(new ParseDef(g, parser, index, node.ref.rule['*']));

        const def = this.rval;
        this.rval = null;

        if(def.len === -1) return done();
        node.arr.push(def);
        this.index += def.len;
      }else if(node instanceof ASTTerm){
        if(node.ref instanceof Element.String){
          const substr = str.slice(index, index + node.ref.str.length);
          if(node.ref.str !== substr) return done();
          node.arr.push(substr);
          this.index += node.ref.str.length;
        }else if(node.ref instanceof Element.CharsRange){
          if(index === str.length || node.getLen() === lenMax || !node.ref.set.has(O.cc(str, index))) return done();
          if(node.arr.length === 0) node.arr.push('');
          node.arr[0] += str[index];
          this.index++;
        }
      }

      this.i = 0;
    }
  }
}

module.exports = Object.assign(ParserBase, {
  Parse,
  ParseDef,
  ParsePat,
  ParseElem,
});