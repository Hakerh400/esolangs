'use strict';

const O = require('omikron');
const Element = require('./element');

class Memory{
  #first = new Element(null);
  #last = new Element(null, this.#first);

  constructor(data=[]){
    for(const bit of data)
      this.push(bit);
  }

  get first(){
    return this.#first.next.val;
  }

  get last(){
    return this.#last.prev.val;
  }

  unshift(bit){
    new Element(bit, this.#first, this.#first.next);
    return this;
  }

  push(bit){
    new Element(bit, this.#last.prev, this.#last);
    return this;
  }

  shift(){
    return this.#first.next.remove();
  }

  pop(){
    return this.#last.prev.remove();
  }

  replace(transfs){
    const first = this.#first;

    loop: while(1){
      const substs = [];

      for(const transf of transfs){
        const subst = this.findSubst(transf[0], transf[1], transf[2], transf[3]);
        if(subst !== null) substs.push(subst);
      }

      if(substs.length === 0) break loop;

      const subst = substs.reduce((prev, next) => {
        const prevElem = prev[0];
        const nextElem = next[0];
        let e1 = first;

        while(1){
          if(e1 === prevElem) return prev;
          if(e1 === nextElem) return next;
          e1 = e1.next;
        }
      });

      this.subst(subst[0], subst[1], subst[2]);

      if(first.next.val === 1) break;
    }
  }

  findSubst(find, replace, start, end){
    const first = this.#first;
    const last = this.#last;
    const len = find.length;

    if(find.length === 0) return [first.next, 0, replace];
    if(first.next === last) return null;

    const ltr = start || !end;
    const iStart = ltr ? 0 : find.length - 1;
    const iEnd = ltr ? find.length : -1;
    const di = ltr ? 1 : -1;

    let e1 = ltr ? first.next : last.prev;

    loop: while(e1.val !== null){
      let e2 = e1;

      for(let i = iStart; i !== iEnd; i += di){
        const bit = find[i];
        const {val} = e2;

        if(val === null) return null;

        if(val !== bit){
          if(start || end) return null;
          e1 = ltr ? e1.next : e1.prev;
          continue loop;
        }

        e2 = ltr ? e2.next : e2.prev;
      }

      if(ltr ? end && e2 !== last : start && e2 !== first) return null;

      if(!ltr)
        for(let i = 1; i !== len; i++)
          e1 = e1.prev;

      return [e1, len, replace];
    }

    return null;
  }

  subst(elem, len, bits){
    elem = elem.prev;
    for(let i = 0; i !== len; i++) elem.next.remove();
    for(const bit of bits) elem = new Element(bit, elem, elem.next);
    return 1;
  }

  *[Symbol.iterator](){
    let e = this.#first.next;

    while(e.val !== null){
      yield e.val;
      e = e.next;
    }
  }

  toString(){
    let s = '';
    for(const bit of this) s += bit;
    return s;
  }
}

module.exports = Memory;