'use strict';

const O = require('omikron');

class Element{
  #prev;
  #next;

  constructor(val, prev=null, next=null){
    this.val = val;
    this.#prev = prev;
    this.#next = next;

    if(prev !== null) prev.#next = this;
    if(next !== null) next.#prev = this;
  }

  get prev(){ return this.#prev; }
  get next(){ return this.#next; }

  set prev(elem){
    const prev = this.#prev;
    this.#prev = elem;
    if(prev !== null) prev.#next = elem;
    elem.#prev = prev;
    elem.#next = this;
  }

  set next(elem){
    const next = this.#next;
    this.#next = elem;
    if(next !== null) next.#prev = elem;
    elem.#prev = this;
    elem.#next = next;
  }

  remove(){
    const prev = this.#prev;
    const next = this.#next;
    if(prev !== null) prev.#next = next;
    if(next !== null) next.#prev = prev;
    return this.val;
  }
}

module.exports = Element;