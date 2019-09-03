'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');

class BitBuffer{
  constructor(data){
    if(data instanceof BitBuffer)
      data = data.buf;

    this.buf = Buffer.from(data);
    this.len = this.buf.length;

    this.expand(this.len);
  }

  static from(str){
    const arr = str
      .replace(/[^01]/g, '').match(/(?:^$)|.{8}|.+/g)
      .map(bits => parseInt(bits.split('').reverse().join(''), 2));

    return new BitBuffer(arr);
  }

  static parse(str){
    return BitBuffer.from(str);
  }

  copy(){
    return new BitBuffer(this);
  }

  expand(len){
    const lenPrev = this.buf.length;

    this.len = 1 << 32 - Math.clz32(len - 1);
    this.buf = Buffer.concat([this.buf, Buffer.alloc(this.len - lenPrev)]);
  }

  read(i){
    const byteIndex = i >> 3;
    if(byteIndex > this.len) return 0;

    const bitIndex = i & 7;
    return this.buf[byteIndex] & (1 << bitIndex) ? 1 : 0;
  }

  write(i, v){
    const byteIndex = i >> 3;
    if(byteIndex >= this.len){
      if(v === 0) return;
      this.expand(byteIndex + 1);
    }

    const bitIndex = i & 7;
    const mask = 1 << bitIndex;
    if(v) this.buf[byteIndex] |= mask;
    else this.buf[byteIndex] &= ~mask;
  }

  flip(i){
    const byteIndex = i >> 3;
    if(byteIndex >= this.len)
      this.expand(byteIndex + 1);

    const bitIndex = i & 7;
    this.buf[byteIndex] ^= 1 << bitIndex;
  }

  readInt(addr, size=null){
    let num = 0;
    let mask = 1;

    if(size === null){
      while(this.read(addr++)){
        if(this.read(addr++)) num |= mask;
        mask <<= 1;
      }
      num = (num | mask) - 1;
    }else{
      while(size--){
        if(this.read(addr++)) num |= mask;
        mask <<= 1;
      }
    }

    return num;
  }

  writeInt(addr, num, size=null){
    if(size === null){
      num++;
      while(1){
        const bit = num & 1 ? 1 : 0;
        num >>= 1;
        if(!num) break;
        this.write(addr++, 1);
        this.write(addr++, bit);
      }
      this.write(addr, 0);
    }else{
      while(size--){
        this.write(addr++, num & 1 ? 1 : 0);
        num >>= 1;
      }
    }
  }

  toString(){
    return [...this.buf].map(byte => {
      return byte.toString(2).padStart(8, '0').split('').reverse().join('');
    }).join('');
  }
};

module.exports = BitBuffer;