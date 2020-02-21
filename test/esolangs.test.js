'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const jstest = require('@hakerh400/jstest');
const esolangs = require('..');
const cli = require('./cli');
const slowTests = require('./slow-tests');

const {part, test} = jstest;
const eq = assert.strictEqual;

const args = process.argv.slice(2);

const SINGLE_LANG = null;
const TEST_CLI = SINGLE_LANG === null;
const INCLUDE_SLOW_TESTS = 0; //args.includes('--all');

const cwd = __dirname;
const langsDir = path.join(cwd, 'langs');
const formsDir = path.join(cwd, 'program-forms');

const langs = SINGLE_LANG !== null ? [SINGLE_LANG] : esolangs.getLangs();
const slowTestsObj = O.obj();

for(const slowTest of slowTests){
  if(typeof slowTest === 'string'){
    slowTestsObj[slowTest] = O.obj();
    slowTestsObj[slowTest]['*'] = 1;
    continue;
  }

  const [lang, test] = slowTest;

  if(!(lang in slowTestsObj))
    slowTestsObj[lang] = O.obj();

  slowTestsObj[lang][test] = 1;
}

if(TEST_CLI) cli.test();

for(const name of langs){
  const slowTest = !INCLUDE_SLOW_TESTS && name in slowTestsObj ? slowTestsObj[name] : null;
  if(slowTest !== null && '*' in slowTest) continue;

  const info = esolangs.getInfo(name);
  if(O.has(info, 'wip') && info.wip) continue;

  part(`Language ${O.sf(name)}`, () => {
    const dir = path.join(langsDir, info.id);
    const fileNames = O.sortAsc(fs.readdirSync(dir));

    for(const fileName of fileNames){
      if(!fileName.endsWith('.txt')) continue;

      const programName = fileName.slice(0, fileName.length - 4);
      if(slowTest !== null && programName in slowTest) continue;

      const filePath = path.join(dir, fileName);
      const src = O.rfs(filePath);

      test(programName, () => {
        const formFile = `${programName}.js`;
        const path1 = path.join(dir, formFile);
        const path2 = path.join(formsDir, formFile);
        const formFunc = require(fs.existsSync(path1) ? path1 : path2);

        for(const [input, expectedOutput] of formFunc(src)){
          const actualOutput = esolangs.run(name, src, input);
          
          eq(
            actualOutput.toString('binary'),
            Buffer.from(expectedOutput).toString('binary'),
          );
        }
      });
    }
  });
}