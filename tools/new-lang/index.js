'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const O = require('omikron');
const config = require('../../config');

const cwd = __dirname;
const mainDir = path.join(cwd, '../..');

const run = async args => {
  if(args.length !== 2)
    O.exit('Usage: <language name> <language id>');

  const [name, id] = args;
  let langsNum;

  // Update esolangs.json
  {
    const esolangsJson = path.join(mainDir, 'esolangs.json');
    const arr = JSON.parse(O.rfs(esolangsJson, 1));
    arr.push({
      name,
      id,
      details: null,
      wip: true,
    });
    langsNum = arr.length;
    O.wfs(esolangsJson, O.crlf(O.sf(arr).replace(/\},[\r\n]\s*\{/g, '}, {')));
  }

  // Update readme.md
  {
    const readmeFile = path.join(mainDir, 'readme.md');
    let str = O.rfs(readmeFile, 1);
    str = str.replace(/(\*\*Number of languages:\*\* )\d+/, (a, b) => {
      return `${b}${langsNum}`;
    });
    O.wfs(readmeFile, str);
  }

  // Initialize and open parser scripts for the new language
  {
    const langsDir = path.join(mainDir, 'src/langs');
    const blankDir = path.join(langsDir, 'blank');
    const langDir = path.join(langsDir, id);

    const files = [
      ['index.js', 0],
      ['syntax.txt', 1],
      ['ast.js', 1],
      ['ctors.js', 1],
      ['engine.js', 1],
    ];

    fs.mkdirSync(langDir);

    for(const [file, open] of files){
      const src = path.join(blankDir, file);
      const dest = path.join(langDir, file);

      fs.copyFileSync(src, dest);
      if(open) await openFile(dest);
    }
  }

  // Add a new local test
  {
    const localTestDir = path.join(mainDir, 'local-test');
    const langNameFile = path.join(localTestDir, 'lang.txt');
    const srcsDir = path.join(localTestDir, 'srcs');
    const srcFile = path.join(srcsDir, `${id}.txt`);

    O.wfs(langNameFile, name);

    if(!fs.existsSync(srcsDir))
      fs.mkdirSync(srcsDir);

    O.wfs(srcFile, '');
    await openFile(srcFile);
  }
};

const openFile = file => {
  return new Promise((res, rej) => {
    const {textEditor} = config;
    if(textEditor === null) return res(null);

    const proc = cp.spawn(textEditor, [dest]);

    proc.on('exit', code => {
      if(code === 0) res(0);
      else rej(code);
    });
  });
};

module.exports = run;