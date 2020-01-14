'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const assert = require('assert');
const O = require('omikron');
const jstest = require('@hakerh400/jstest');
const esolangs = require('../..');

const {part, test} = jstest;

const cwd = __dirname;
const nodeExe = process.execPath;
const mainScript = path.join(cwd, '../../index.js');

const testDir = path.join(cwd, 'test');
const srcFile = path.join(testDir, 'src.txt');
const inputFile = path.join(testDir, 'input.txt');
const outputFile = path.join(testDir, 'output.txt');

const lang = esolangs.getInfo('brainfuck').id;
const src = '+[-->-[>>+>-----<<]<--<---]>-.>>>+.>>..+++[.>]<<<<.+++.------.<<-.>>>>+.';
const input = '';

const runTest = () => {
  part('CLI', () => {
    test('CLI test', () => {
      O.wfs(srcFile, src);
      O.wfs(inputFile, input);
      O.wfs(outputFile, '');
      assert(O.rfs(outputFile, 1) === '');

      const {stdout, stderr} = cp.spawnSync(nodeExe, [
        mainScript,
        lang,
        srcFile,
        inputFile,
        outputFile,
      ]);

      assert(stdout.length === 0);
      assert(stderr.length === 0);
      assert(O.rfs(outputFile, 1) === esolangs.getStr('hello-world'));
    });
  });
};

module.exports = {
  test: runTest,
};