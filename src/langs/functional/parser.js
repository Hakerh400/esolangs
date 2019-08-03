'use strict';

const O = require('omikron');
const tokenizer = require('./tokenizer');

function parse(tokenized){
  var {tokens} = tokenized;
  var len = tokens.length;

  var parsed = [];
  var i, tk;

  push(1);

  for(i = 0; i !== len; i++){
    tk = tokens[i];

    switch(tk){
      case 0: push(1); break;
      case 1: pop(1); break;
      case 2: pop(0); break;

      default:
        push(0);
        top().ident = new Identifier(tk);
        break;
    }
  }

  while(parsed.length !== 1)
    pop();

  return new Parsed(parsed[0]);

  function push(mode){
    if(mode === 1) parsed.push(new List());
    else parsed.push(new CallChain());
  }

  function pop(mode){
    var elem = parsed.pop();
    top().push(elem);

    if(mode === 1 && elem.isCall()){
      var list = parsed.pop();
      top().push(list);
    }
  }

  function top(){
    return parsed[parsed.length - 1];
  }
}

class Element{
  constructor(){}

  isIdent(){ return false; }
  isList(){ return false; }
  isCall(){ return false; }
};

class Identifier extends Element{
  constructor(id){
    super();
    this.id = id;
  }

  clone(deep){
    if(!deep) return this;
    return new Identifier(this.id);
  }

  toString(){
    var {id} = this;
    if(typeof id !== 'string') return String(id);
    return tokenizer.Tokenized.stringify(id, 0);
  }

  isIdent(){ return true; }
};

class List extends Element{
  constructor(arr=[]){
    super();
    this.arr = [];
  }

  clone(deep){
    var {arr} = this;

    if(deep) arr = arr.map(a => a.clone(1));
    else arr = arr.slice();

    return new List(arr);
  }

  push(callChain){
    this.arr.push(callChain);
  }

  toString(){
    var stack = [new Stringified(this)];

    while(1){
      var elem = stack[stack.length - 1];

      if(elem.done){
        if(stack.length === 1)
          return elem.str;

        stack.pop();
        stack[stack.length - 1].set(elem.str);

        continue;
      }

      stack.push(new Stringified(elem.get()));
    }
  }

  isList(){ return true; }
};

class CallChain extends Element{
  constructor(ident=null, arr=[]){
    super();
    this.ident = ident;
    this.arr = arr;
  }

  clone(deep){
    var {ident, arr} = this;

    ident = ident.clone(deep);

    if(deep) arr = arr.map(a => a.clone(1));
    else arr = arr.slice();

    return new CallChain(ident, arr);
  }

  push(list){
    this.arr.push(list);
  }

  toString(){
    return `${this.ident}${this.arr.join('')}`;
  }

  isCall(){ return true; }
}

class Stringified{
  constructor(elem){
    var isList = elem instanceof List;

    this.arr = elem.arr.slice();
    this.str = isList ? '(' : elem.ident.toString();
    this.isList = isList;
    this.done = this.arr.length === 0;

    if(this.done && this.isList)
      this.str += ')';
  }

  len(){
    return this.length;
  }

  get(){
    return this.arr[0];
  }

  set(str){
    if(this.isList && this.str.length !== 1)
      this.str += ',';

    this.str += str;
    this.arr.shift();

    if(this.arr.length === 0){
      this.done = 1;

      if(this.isList)
        this.str += ')';
    }
  }
};

class Parsed{
  constructor(list){
    this.list = list;
  }

  toString(){
    return this.list.toString();
  }
};

module.exports = {
  Element,
  Identifier,
  List,
  CallChain,

  Stringified,
  Parsed,

  parse,
};