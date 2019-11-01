'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const SG = require('../serializable-graph');
const Thread = require('./thread');
const cgs = require('./common-graph-nodes');

class InterpreterBase extends SG.Node{
  static ptrsNum = this.keys(['threads']);

  constructor(g, script=null){
    super(g);
    if(g.dsr) return;
    g.setIntp(this);

    this.threads = new cgs.Array(g);
    this.threadIndex = -1;

    if(script !== null){
      const execute = new cgs.Execute(g, script);
      this.createThread(execute);
    }
  }

  ser(s){ super.ser(s); s.writeInt(this.threadIndex); }
  deser(s){ super.deser(s); this.threadIndex = s.readInt(); }

  get len(){ return this.threads.length; }
  get th(){ return this.threads[this.threadIndex]; }
  get active(){ return this.len !== 0; }
  get done(){ return this.len === 0; }

  tick(){
    this.th.tick(this);
    if(this.active) this.threadIndex = (this.threadIndex + 1) % this.len;
  }

  createThread(sf){
    this.addThread(new Thread(this.g, sf));
  }

  addThread(th){
    this.threads.push(th);
    th.index = this.len - 1;
    if(this.threadIndex === -1) this.threadIndex = 0;
  }

  removeThread(th){
    const {threads} = this;
    const {index} = th;
    const last = threads.pop();

    if(index === -1) throw new TypeError('Cannot remove thread with index -1');
    if(index <= this.threadIndex) this.threadIndex--;

    if(last !== th){
      last.index = index;
      threads[index] = last;
    }
  }

  catch(err, th){
    this.g.stderr.write(err.toString());
    this.removeThread(th);
  }
}

module.exports = InterpreterBase;