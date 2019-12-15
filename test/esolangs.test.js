'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const jstest = require('@hakerh400/jstest');
const esolangs = require('..');
const cli = require('./cli');
const skipTests = require('./skip-tests');

const SINGLE_LANG = null;
const TEST_CLI = SINGLE_LANG === null;

const cwd = __dirname;
const langsDir = path.join(cwd, 'langs');
const formsDir = path.join(cwd, 'program-forms');

const eq = assert.strictEqual;
const ok = assert.ok;
const {part, test} = jstest;

const langs = SINGLE_LANG !== null ? [SINGLE_LANG] : esolangs.getLangs();
const skipTestsObj = O.obj();

for(const skipTest of skipTests){
  if(typeof skipTest === 'string'){
    skipTestsObj[skipTest] = O.obj();
    skipTestsObj[skipTest]['*'] = 1;
    continue;
  }

  const [lang, test] = skipTest;

  if(!(lang in skipTestsObj))
    skipTestsObj[lang] = O.obj();

  skipTestsObj[lang][test] = 1;
}

if(TEST_CLI) cli.test();

for(const name of langs){
  const skipTest = name in skipTestsObj ? skipTestsObj[name] : null;
  if(skipTest !== null && '*' in skipTest) continue;

  part(`Language ${O.sf(name)}`, () => {
    const info = esolangs.getInfo(name);
    const dir = path.join(langsDir, info.id);
    const fileNames = O.sortAsc(fs.readdirSync(dir));

    for(const fileName of fileNames){
      if(!fileName.endsWith('.txt')) continue;

      const programName = fileName.slice(0, fileName.length - 4);
      if(skipTest !== null && programName in skipTest) continue;

      const filePath = path.join(dir, fileName);
      const src = O.rfs(filePath);

      test(programName, () => {
        const formFile = `${programName}.js`;
        const path1 = path.join(dir, formFile);
        const path2 = path.join(formsDir, formFile);
        const formFunc = require(fs.existsSync(path1) ? path1 : path2);

        for(const [input, expectedOutput] of formFunc(src)){
          const actualOutput = esolangs.run(name, src, input);
          eq(actualOutput.toString('binary'), Buffer.from(expectedOutput).toString('binary'));
        }
      });
    }
  });
}