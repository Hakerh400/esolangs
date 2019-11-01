'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

class Range{
  constructor(start=null, end=null){
    this.start = start;
    this.end = end;
  }

  set(start=this.start, end=this.end){
    this.start = start;
    this.end = end;
  }

  has(num){
    if(this.isAny()) return 1;
    if(this.isClosedLeft() && num < this.start) return 0;
    if(this.isClosedRight() && num > this.end) return 0;
    return 1;
  }

  size(){
    if(this.isOpen()) return null;
    return this.end - this.start + 1;
  }

  len(){
    return this.size();
  }

  eq(range){
    return range.start === this.start && range.end === this.end;
  }

  neq(range){
    return !this.eq(range);
  }

  overlaps(range){
    const {start, end} = this;

    if(this.isAny() || range.isAny()) return 1;

    if(this.isOpenLeft()){
      if(range.isOpenLeft()) return 1;
      return range.start <= start;
    }

    if(this.isOpenRight()){
      if(range.isOpenRight()) return 1;
      return range.end >= end;
    }

    if(range.isOpenLeft()){
      if(this.isOpenLeft()) return 1;
      return start <= range.start;
    }

    if(range.isOpenRight()){
      if(this.isOpenRight()) return 1;
      return end >= range.end;
    }

    return start <= range.start && end >= range.start;
  }

  isValid(){
    if(this.isOpen()) return 1;
    return this.start <= this.end;
  }

  isClosedLeft(){ return this.start !== null; }
  isClosedRight(){ return this.end !== null; }
  isClosed(){ return this.isClosedLeft() && this.isClosedRight(); }
  isOpenLeft(){ return this.start === null; }
  isOpenRight(){ return this.end === null; }
  isOpen(){ return this.isOpenLeft() || this.isOpenRight(); }

  isSingleton(){ return this.size() === 1; }
  isUnit(){ return this.start === 1 && this.end === 1; }
  isAny(){ return this.isOpenLeft() && this.isOpenRight(); }
}

module.exports = Range;