'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Rule = require('./rule');
const Section = require('./section');
const Pattern = require('./pattern');
const Element = require('./element');
const Range = require('./range');

// TODO: be consistent: use "definition" instead of "rule" everywhere
// TODO: linter: require latest node version
// TODO: linter: no semicolon after class

module.exports = {
  parse,
};

function parse(syntax, str){
  str = str.replace(/\r\n|\r|\n/g, '\n');

  const len = str.length; // String length

  let i = 0; // Position from start of string
  let j = 0; // Line index
  let k = 0; // Position from start of line

  let lastChar = null; // The last char that was parsed
  let pack = ''; // Current package

  // Handle error
  const err = msg => {
    const line = O.sanl(str)[j];
    log(`Syntax error in package ${sf(pack)} on line ${j + 1}:\n`);
    log(line);
    log('^'.padStart(k + 1));
    log(`\n${msg}`);
    O.proc.exit(1);
  };

  const sf = a => O.sf(a); // JSON.stringify
  const neof = () => i !== len; // Not end of file
  const eof = () => i === len; // End of file

  // Was the last char a space
  const lsp = (parse=1) => {
    if(parse) s();
    return /\s/.test(lastChar);
  };

  // Read single char
  const c = (char=null, modify=1) => {
    const c = str[i];

    if(char !== null && typeof char !== 'string'){
      modify = char;
      char = null;
    }

    if(modify){
      if(eof()) err('Unexpected EOF');
      pc(c);
      if(char !== null && c !== char)
        err(`Expected ${sf(char)}, but got ${sf(c)}`);
    }

    return c;
  }

  // Process char
  const pc = c => {
    if(O.cc(c) > 255) err('Only characters in range [0-255] are allowed');

    i++; k++;
    if(c === '\n'){
      j++;
      k = 0;
    }

    lastChar = c;
  };

  const s = () => { while(neof() && /\s/.test(c(0))) c(); }; // Read zero or more spaces
  const ss = () => { if(eof() || /\S/.test(c(0))) err('Missing space'); }; // Read one or more spaces

  // Match char and surrounding spaces
  const sc = (char, modify) => {
    s();
    const result = c(char, modify);
    return !modify && typeof char === 'string' ? result === char : result;
  }

  const is = char => sc(char, 0); // Check for the given char

  // Read char if possible
  const scm = char => {
    if(!is(char)) return 0;
    sc();
    return 1;
  }

  // Ensure that parsed integer is not too large
  const checkNum = num => {
    if(num >= 2 ** 24) err('Too large number');
    return num;
  };

  // Match regular expression
  const reg = (reg, spaces=1, name=reg) => {
    if(spaces) s();
    reg.lastIndex = i;

    const match = str.match(reg);
    if(match === null) err(`Unable to parse ${name}`);

    const m = match[0];
    for(const char of m) pc(char);

    if(spaces) s();
    return m;
  };

  // Several parsing functions
  const p = {
    ident: (s=1) => reg(/[a-z\$_][a-z0-9\$_]*/iy, s, 'identifier'),
    num: (s=1) => checkNum(reg(/[0-9]+/y, s, 'number')),
    rdots: (s=1) => reg(/\.{2}/y, s, 'range dots'),
    code: (s=1) => reg(/[^#]*/y, s, 'code'),
  };

  // Parse range of integers
  const parseRange = (r=new Range()) => {
    const v = () => scm('*') ? null : +p.num(); // Parse value

    let val1 = v()
    let val2 = val1;

    if(c(0) === '.'){
      p.rdots();
      val2 = v();
    }else if(scm('+')){
      val2 = null;
    }else if(scm('-')){
      val2 = val1;
      val1 = null;
    }

    r.start = val1;
    r.end = val2;

    if(!r.isValid()) err('Invalid range');
    return r;
  };

  // Parse escape sequence
  const parseEscSeq = chars => {
    // Argument `chars` contains extra characters that must be escaped

    const ch = c();

    if(ch === '\\' || chars.includes(ch)){ // Literal character
      return ch;
    }else if(/x/i.test(ch)){ // Hexadecimal escape sequence
      const hex = c() + c();
      if(!/[0-9a-f]{2}/i.test(hex)) err('Invalid hexadecimal escape sequence');
      return O.sfcc(parseInt(hex, 16));
    }else if(ch === 'r'){ // Carriage return
      return '\r';
    }else if(ch === 'n'){ // Line feed
      return '\n';
    }else if(ch === 't'){ // Tab
      return '\t';
    }else if(ch === '\n'){ // Literal new line
      err('New line should not be escaped like this');
    }else{ // Any other character
      err('Unrecognized escape sequence');
    }
  };

  // Parse pattern element
  const parseElem = (extra=1) => {
    /**
     * Argument `extra` stands for extra data. If truthy, after parsing element this function
     * will also attempt to parse extra data. It calls `parseElem` recursively
     * with `extra` set to 0 unconditionally
     */

    const char = sc(0);
    let elem;

    if(char === '"'){ // Literal string
      elem = newElem(Element.String);
      c();

      let str = '';

      while(c(0) !== '"'){
        const char = c();

        if(char === '\\'){ // Escape sequence
          str += parseEscSeq('"');
        }else{ // Literal character
          str += char;
        }
      }

      // Closed quotation marks
      c(1);

      if(c(0) === 'i'){ // Case-insensitive
        if(str !== str.toLowerCase())
          err(`Case-insensitive literal string ${O.sf(str)} must be specified in lower-case`);

        elem.caseInsensitive = 1;
        c(1);
      }

      elem.str = str;
    }else if(char === '['){ // Characters range
      elem = newElem(Element.CharsRange);
      c();

      const inverted = c(0) === '^';
      if(inverted) c();

      while(c(0) !== ']'){
        const range = new Range();

        let first = 1;
        let vals = [];

        while(1){
          const char = c();

          if(first === 0 && /[\-\]]/.test(char))
            err(`Character ${sf(char)} must be escaped`);
          if(char === '\\'){ // Escape sequence
            vals.push(O.cc(parseEscSeq('-]')));
          }else if(char === '-'){ // Character separator should not appear here
            err('Missing character');
          }else if(char === '\n'){ // Literal new line
            err('New lines must be escaped');
          }else{ // Any other character
            vals.push(O.cc(char));
          }

          // In case of single character break the loop
          if(!first || c(0) !== '-') break;

          // Prepare for the last character in the current range
          first = 0;
          c();
        }

        if(vals.length === 1) vals.push(vals[0]);

        range.start = vals[0];
        range.end = vals[1];

        if(!range.isValid()) err('Invalid characters range');
        if(elem.overlaps(range)) err('Overlapping characters range');

        elem.add(range);
      }

      if(inverted) elem.invert();

      // Closed bracket
      c();

      if(elem.isEmpty()) err('Empty characters range');
    }else if(/[a-z0-9\$_]/i.test(char)){ // Non-terminal
      elem = newElem(Element.NonTerminal);

      const ruleName = p.ident();
      elem.rule = ruleName;

      /**
       * Try to parse indexed range
       * Indexed range must be immediatelly after element (spaces not allowed)
       */
      if(!lsp() && scm('[')){
        parseRange(elem.ruleRange);
        sc(']');
      }
    }else if(char === '.'){ // Any character
      elem = newElem(Element.CharsRange);
      c();

      const range = new Range(0, 255);
      elem.add(range);
    }else{
      err('Unexpected token in pattern');
    }

    // Try to parse extra data (range, greediness and separator)
    ext: if(extra){
      // Extra data must be immediatelly after element (spaces not allowed)
      if(lsp()) break ext;

      const r = elem.range;

      /**
       * Parse element range
       * One of:
       *   elem{start..end} ---> {start..end}
       *   elem?            ---> {0..1}
       *   elem*            ---> {0..*}
       *   elem+            ---> {1..*}
       * Note that `?` is also used for greediness, so `??` is a valid specifier
       */
      {
        if(scm('{')){
          parseRange(r);
          if(r.isOpenLeft()) r.start = 0;
          sc('}');
        }else if(scm('?')){
          r.set(0, 1);
        }else if(scm('*')){
          r.set(0, null);
        }else if(scm('+')){
          r.set(1, null);
        }
      }
      if(lsp()) break ext;

      // Parse greediness
      {
        if(scm('?')) elem.greediness = 0;
        if(lsp()) break ext;
      }

      // Parse separator
      {
        // Separator is optional, if pattern end is reached don't parse it
        if(/[|}]/.test(sc(0))) break ext;

        /**
         * Separator is not allowed for range with `end <= 1`
         * Throw error instead of breaking this section, because
         * we ensured the separator is present and thus should be parsed
         */
        if(r.isClosedRight() && r.end <= 1)
          err('Separator cannot be specified for this range');

        const sep = parseElem(0);
        elem.sep = sep;
      }
    }

    return elem;
  };

  // Parse match section
  const parseMatchSect = (rule, ctor) => {
    sc('{');
    // TODO: allow empty patterns, remove this check and make sure empty patterns work properly
    if(is('|')) err('Match section cannot start with delimiter');
    if(is('}')) err('Match cannot be empty');

    const sect = new ctor();

    // Parse patterns
    while(!scm('}')){
      const pat = new Pattern();

      // Parse elements
      while(!(scm('|') || sc('}', 0))){
        const elem = parseElem();
        pat.addElem(elem);
      }

      sect.addPat(pat);
    }

    rule.addSect(sect);
  };

  // Parse code section
  const parseCodeSect = (rule, ctor) => {
    // Code section starts with argument list
    const args = [];

    // Parse argument list
    {
      sc('(');
      if(is(',')) err('Missing first argument');

      while(!scm(')')){
        const arg = p.ident();
        if(args.includes(arg)) err('Duplicate arguments are not allowed');
        args.push(arg);
        scm(',');
      }
    }

    const sect = new ctor();

    sc('{'); s(); c('#');
    const code = p.code(0);
    sc('#'); sc('}');

    try{
      sect.setFunc(args, code);
    }catch(e){
      err(`Code error: ${sf(e.message)}`);
    }

    rule.addSect(sect);
  };

  const rules = O.obj(); // Rules will be stored here after parsing
  const nterms = new Set(); // Keep track of non-terminals to add rules after parsing

  /**
   * New elements should not be constructed directly
   * Use this wrapper function instead
   */
  const newElem = ctor => {
    const elem = new ctor();

    // Check using `instanceof` to allow extensions
    if(elem instanceof Element.NonTerminal)
      nterms.add(elem);

    return elem;
  };

  /**
   * Start parsing rules
   */

  {
    while(neof()){
      s();
      if(eof()) break;

      // Meta directive
      if(scm('#')){
        const type = p.ident();
        sc('{');

        switch(type){
          case 'package':
            const idents = [];
            while(!is('}')){
              idents.push(p.ident());
              scm('.');
            }
            pack = idents.join('.');
            break;

          default: err(`Unrecognized meta directive ${O.sf(type)}`);
        }

        sc('}');
        continue;
      }

      // Parse rule header

      const name = p.ident();
      let range = null;

      if(scm('[')){
        range = parseRange();
        if(!range.isSingleton())
          err('Definition range must be a singleton');
        sc(']');
      }

      const greediness = scm('?') ? 0 : scm('*') ? 2 : 1;
      const rule = new Rule(syntax, pack, name, greediness, range);

      if(!(name in rules)){
        const obj = O.obj();
        obj.size = 0;
        rules[name] = obj;
      }

      const obj = rules[name];

      if('*' in obj) err('Duplicate definition');
      if(!rule.isArr()){
        if(obj.size !== 0) err('Mixed scalar and vector definitions');
        obj['*'] = rule;
      }else{
        const i = range.start;
        if(i in obj) err(`Index ${i} is already defined`);
        obj[i] = rule;
      }

      obj.size++;

      // Parse main section
      // Main section is of type Section.Include
      parseMatchSect(rule, Section.Include);

      // Parse other sections

      while(scm('.')){ // Other sections start with "."
        const type = p.ident();

        switch(type){
          case 'not': case 'exclude':
            parseMatchSect(rule, Section.Exclude);
            break;

          case 'before': parseCodeSect(rule, Section.Before); break;
          case 'inside': parseCodeSect(rule, Section.Inside); break;
          case 'after': parseCodeSect(rule, Section.After); break;

          default:
            err(`Unknown section ${sf(type)}`);
            break;
        }
      }
    }
  }

  // Replace rule names by real rules in non-terminal elements
  for(const nterm of nterms){
    if(!(nterm.rule in rules))
      throw new SyntaxError(`Missing syntax definition for ${O.sf(nterm.rule)}`);

    const rule = rules[nterm.rule];

    if(!('*' in rule)){
      const indices = O.sortAsc(
        O.keys(rule)
          .filter(a => /^\d+$/.test(a))
          .map(a => a | 0)
      );

      const newRule = new Rule(syntax, pack, rule.name, rule.greediness, new Range());
      const sect = new Section.Include();

      for(const index of indices){
        const pat = new Pattern();
        const elem = new Element.NonTerminal(rule[index]);

        elem.ruleRange.start = 1;
        elem.ruleRange.end = 1;

        pat.addElem(elem);
        sect.addPat(pat);
      }

      newRule.addSect(sect);
      rule['*'] = newRule;
    }

    nterm.rule = rule;
  }

  return rules;
}