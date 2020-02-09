'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const assert = require('assert');
const O = require('omikron');
const chunkStream = require('./chunk-stream');

const nodeExe = process.execPath;

const cwd = __dirname;
const procScript = path.join(cwd, 'process');

const defaultSbxOpts = {
  timeout: null,
};

class Sandbox{
  static #maxInstancesNum = 3;
  static #instances = new Set();

  static get maxInstancesNum(){
    return this.#maxInstancesNum;
  }

  static set maxInstancesNum(val){
    if(val !== null && (typeof val !== 'number' || !Object.is(val, val | 0)))
      throw new TypeError('Invalid value for maximum sandbox instances number');

    this.#maxInstancesNum = val;
  }

  #proc = null;
  #exitCode = null;
  #errBufs = [];
  #disposed = 0;

  #mutex = O.sem();
  #procMutex = O.sem();

  constructor(){
    if(Sandbox.#instances.size === Sandbox.#maxInstancesNum)
      throw new RangeError('Maximum sandbox instances number exceeded');

    Sandbox.#instances.add(this);
  }

  async run(name, source, input, opts=null, sbxOptsOpts=null){
    await this.#mutex.wait();

    let timeoutID = null;

    try{
      this.assertNotDisposed();

      sbxOptsOpts = {...defaultSbxOpts, ...sbxOptsOpts};

      let timeExceeded = 0;

      if(this.#proc === null)
        await this.spawnProc();

      const proc = this.#proc;

      if(sbxOptsOpts.timeout !== null){
        timeoutID = setTimeout(() => {
          if(this.#disposed) return;
          timeExceeded = 1;
          this.killProc();
        }, sbxOptsOpts.timeout);
      }

      {
        const {stdin, stdout} = proc;

        chunkStream.write(stdin, name);
        chunkStream.write(stdin, source);
        chunkStream.write(stdin, input);
        chunkStream.write(stdin, JSON.stringify(opts));

        try{
          const ok = (await chunkStream.read(stdout))[0];
          const result = await chunkStream.read(stdout);

          if(ok) return [1, result];
          else return [0, result.toString()];
        }catch(err){
          await this.#procMutex.wait();

          try{
            this.assertNotDisposed();

            if(timeExceeded)
              throw new RangeError('Time limit exceeded');

            if(this.#errBufs.length !== 0){
              const stderr = Buffer.concat(this.#errBufs);
              this.#errBufs.length = 0;
              throw new Error(stderr);
            }

            throw err;
          }finally{
            this.#procMutex.signal();
          }
        }
      }
    }finally{
      clearTimeout(timeoutID);
      this.#mutex.signal();
    }
  }

  refresh(){
    this.assertNotDisposed();
    this.killProc();
  }

  async spawnProc(){
    this.assertNotDisposed();
    assert(this.#proc === null);

    await this.#procMutex.wait();

    const proc = this.#proc = cp.spawn(nodeExe, [procScript]);
    this.#exitCode = null;

    proc.stderr.on('data', buf => {
      this.#errBufs.push(buf);
    });

    proc.on('exit', code => {
      this.#proc = null;
      this.#exitCode = code;
      this.#procMutex.signal();
    });
  }

  killProc(){
    this.assertNotDisposed();
    assert(this.#proc !== null);

    this.#proc.kill();
    this.#proc = null;
  }

  dispose(){
    this.assertNotDisposed();

    if(this.#proc !== null)
      this.killProc();
    
    Sandbox.#instances.delete(this);
    this.#disposed = 1;
  }

  assertNotDisposed(){
    if(this.#disposed)
      throw new TypeError('The sandbox has been disposed');
  }
}

module.exports = Sandbox;