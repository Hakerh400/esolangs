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
const INCLUDE_SLOW_TESTS = 0;

const cwd = __dirname;
const langsDir = path.join(cwd, 'langs');
const formsDir = path.join(cwd, 'program-forms');

const langs = SINGLE_LANG !== null ? [SINGLE_LANG] : esolangs.getLangs();
const slowTestsObj = O.obj();

const hwStrId = 'hello-world';
const hwString = esolangs.getStr(hwStrId);

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

  if(O.has(info, 'wip') && info.wip){
    if(!SINGLE_LANG) continue;
    esolangs.debugMode = 1;
  }

  if(O.has(info, 'interactive') && info.interactive){
    assert(!SINGLE_LANG);
    continue;
  }

  part(`Language ${O.sf(name)}`, async () => {
    if(O.has(info, 'tests') && !info.tests){
      assert(!SINGLE_LANG);
      return;
    }

    let foundTest = 0;

    testHwProg: {
      const hwProg = await esolangs.getHwProg(name);
      if(hwProg === null) break testHwProg;

      foundTest = 1;

      test(hwStrId, async () => {
        const opts = {
          inputAdapter: 'text',
          outputAdapter: 'text',
        };

        const output = await esolangs.run(name, hwProg, '', opts);
        eq(output.toString().trim(), hwString);
      });
    }

    const dir = path.join(langsDir, info.id);
    if(fs.existsSync(dir)){
      const fileNames = O.sortAsc(fs.readdirSync(dir));

      for(const fileName of fileNames){
        if(!fileName.endsWith('.txt')) continue;

        const programName = fileName.slice(0, fileName.length - 4);

        if(slowTest !== null && programName in slowTest){
          foundTest = 1;
          continue;
        }

        const filePath = path.join(dir, fileName);
        const src = O.rfs(filePath);

        foundTest = 1;

        test(programName, async () => {
          const formFile = `${programName}.js`;
          const path1 = path.join(dir, formFile);
          const path2 = path.join(formsDir, formFile);
          const formFunc = require(fs.existsSync(path1) ? path1 : path2);

          for(const testCase of formFunc(src)){
            const [
              input,
              expectedOutput,
              [
                inputAdapter = 'text',
                outputAdapter = 'text',
              ] = [],
            ] = testCase;

            const opts = {
              inputAdapter,
              outputAdapter,
            };

            const actualOutput = await esolangs.run(name, src, input, opts);

            assert(Buffer.isBuffer(actualOutput));
            
            eq(
              actualOutput.toString(),
              Buffer.from(expectedOutput).toString(),
            );
          }
        });
      }
    }

    if(!foundTest)
      assert.fail(`No tests found`);
  });
}