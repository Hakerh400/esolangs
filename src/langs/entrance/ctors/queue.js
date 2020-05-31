'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../../..');
const cs = require('.');

const {Base} = cs;

class Comparable extends Base{
  #comparable = new O.Comparable();

  cmp(obj){ return this.#comparable.cmp(obj); }
}

class Queue extends Base{
  #queue = new O.PriorityQueue();

  get arr(){ return this.#queue.arr; }
  get len(){ return this.#queue.len; }
  get isEmpty(){ return this.#queue.isEmpty; }

  push(elem){ this.#queue.push(elem); }
  pop(){ return this.#queue.pop(); }
  top(){ return this.#queue.top(); }

  *[Symbol.iterator](){ yield* this.#queue; }
}

const ctors = {
  Comparable,
  Queue,
};

Object.assign(cs, ctors);
module.exports = cs;