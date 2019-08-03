'use strict';

const O = require('omikron');

function tokenize(src){
  if(Array.isArray(src)){
    src = src.filter(src => src.trim().length !== 0);
    src = src.join(',');
  }

  var len = src.length;

  var tokens = [];
  var parens = 0;
  var ident = 1;
  var i, c;

  for(i = 0; i !== len; i++){
    c = src[i];
    processChar();
  }

  c = ')';

  while(parens !== 0 || ident)
    processChar();

  return new Tokenized(tokens);

  function processChar(){
    if(/\s/.test(c)) return;

    if(ident){
      if(!forcedIdent() && c === ')') getClosedParen();
      else getIdent();
    }else{
      getToken();
    }
  }

  function getToken(){
    switch(c){
      case '(': getOpenParen(); break;
      case ')': getClosedParen(); break;
      case ',': getComma(); break;
      default: getIdent(); break;
    }
  }

  function getIdent(){
    var str;
    if(i !== len) str = src.substring(i);
    else str = ')';

    var reg;
    if(parens === 0) reg = /^(?:\\[\s\S]|[\s\S])(?:\\[\s\S]|[^\(\,\s])*/;
    else reg = /^(?:\\[\s\S]|[\s\S])(?:\\[\s\S]|[^\(\)\,\s])*/;

    var match = str.match(reg);

    var s = match[0];
    i += s.length - 1;

    s = s.replace(/\\([\\\(\)\,\s])/g, (a, b) => b);

    if(ident) tokens.push(s);
    else tokens.push(0, s, 1);

    ident = 0;
  }

  function getOpenParen(){
    tokens.push(0);
    parens++;
    ident = 1;
  }

  function getClosedParen(){
    if(parens === 0){
      getIdent();
    }else{
      tokens.push(1);
      parens--;
      ident = 0;
    }
  }

  function getComma(){
    tokens.push(2);
    ident = 1;
  }

  function forcedIdent(){
    if(tokens.length === 0) return 0;
    return tokens[tokens.length - 1] === 2;
  }
}

class Tokenized{
  constructor(tokens){
    this.tokens = tokens;
  }

  static stringify(str, quotes=1){
    str = str.split('').map(char => {
      if(char >= ' ' && char <= '~'){
        if(char === '\\') return '\\\\';
        if(quotes && char === '"') return '\\"';
        return char;
      }

      if(char === '\r') return '\\r';
      if(char === '\n') return '\\n';

      return `\\x${O.cc(char).toString(16).toUpperCase().padStart(2, '0')}`;
    }).join('');

    if(quotes)
      str = `"${str}"`;

    return str;
  }

  toString(){
    var str = this.tokens.map(token => {
      switch(token){
        case 0: return '('; break;
        case 1: return ')'; break;
        case 2: return ','; break;
        default: return Tokenized.stringify(token); break;
      }
    }).join(' ');

    return str;
  }
};

module.exports = {
  Tokenized,
  tokenize,
};