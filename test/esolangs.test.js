'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const jstest = require('@hakerh400/jstest');
const esolangs = require('..');
const skipList = require('./skip-langs');

const SINGLE_LANG = null//'Examinable Invocation Vector';

const cwd = __dirname;
const langsDir = path.join(cwd, 'langs');
const formsDir = path.join(cwd, 'program-forms');

const eq = assert.strictEqual;
const ok = assert.ok;
const {part, test} = jstest;

const langs = SINGLE_LANG !== null ? [SINGLE_LANG] : esolangs.getLangs();
const skipObj = O.arr2obj(skipList);

for(const name of langs){
  if(name in skipObj) continue;

  part(`Language ${O.sf(name)}`, () => {
    const info = esolangs.getInfo(name);
    const dir = path.join(langsDir, info.id);
    const fileNames = O.sortAsc(fs.readdirSync(dir));

    for(const fileName of fileNames){
      if(!fileName.endsWith('.txt')) continue;

      const filePath = path.join(dir, fileName);
      const src = O.rfs(filePath);
      const programName = fileName.slice(0, fileName.length - 4);

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