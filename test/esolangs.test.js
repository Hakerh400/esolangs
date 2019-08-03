'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('..');

const cwd = __dirname;
const langsDir = path.join(cwd, 'langs');
const formsDir = path.join(cwd, 'program-forms');

const eq = assert.strictEqual;
const ok = assert.ok;

for(const name of esolangs.getLangs()){
  describe(`Language ${O.sf(name)}`, () => {
    const info = esolangs.getInfo(name);
    const dir = path.join(langsDir, info.id);
    const fileNames = fs.readdirSync(dir);

    for(const fileName of fileNames){
      if(!fileName.endsWith('.txt')) continue;

      const filePath = path.join(dir, fileName);
      const src = O.rfs(filePath);
      const programName = fileName.slice(0, fileName.length - 4);

      it(programName, () => {
        const formFile = `${programName}.js`;
        const path1 = path.join(dir, formFile);
        const path2 = path.join(formsDir, formFile);
        const formFunc = require(fs.existsSync(path1) ? path1 : path2);

        for(const [input, expectedOutput] of formFunc(src)){
          const actualOutput = esolangs.run(name, src, input);
          ok(actualOutput.equals(Buffer.from(expectedOutput)));
        }
      });
    }
  });
}