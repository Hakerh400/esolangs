'use strict';

const fs = require('fs');
const path = require('path');
const stream = require('stream');
const O = require('omikron');
const esolangs = require('..');
const chunkStream = require('./chunk-stream');

const {stdin, stdout, stderr} = process;

const main = async () => {
  stdin.ref();

  const st = new stream.PassThrough();
  stdin.pipe(st);

  while(1){
    const lang = await chunkStream.read(st, 'latin1');
    const src = await chunkStream.read(st);
    const input = await chunkStream.read(st);
    const opts = JSON.parse(await chunkStream.read(st, 'latin1'));

    const output = await esolangs.run(lang, src, input, opts);
    chunkStream.write(stdout, output);
  }
};

main().catch(err => {
  stderr.write(String(err), () => {
    process.exit(1);
  });
});