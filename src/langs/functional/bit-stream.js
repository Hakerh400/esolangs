'use strict';

const O = require('omikron');

const binLen = a => a && (Math.log2(a) | 0) + 1;

class BitStream{
  constructor(arr=null, checksum=false){
    this.arr = new Uint8Array(0);
    this.len = 0;
    this.bits = '';

    this.rIndex = 0;
    this.rBits = '';

    this.error = false;

    if(arr != null){
      this.parse([...arr], checksum);
    }
  }

  parse(arr, checksum=false){
    if(checksum){
      if(!this.checkArr(arr)){
        this.error = true;
        arr.length = 0;
      }
    }

    this.arr = Uint8Array.from(arr);
    this.len = this.arr.length;
  }

  checkArr(arr){
    if(arr.length & 31) return false;

    var csum = new Uint8Array(arr.splice(arr.length - 32));

    arr.forEach((byte, index) => {
      var cs = csum[index & 31];
      arr[index] ^= cs ^ this.getIndexValue(index ^ cs, .8);
    });

    var hash = O.sha256(arr);

    arr.forEach((byte, index) => {
      arr[index] = byte - this.getIndexValue(index, .9) & 255;
    });

    hash.forEach((byte, index) => {
      csum[index] ^= byte;
    });

    if(csum.some(byte => byte)) return false;
    return arr;
  }

  writeByte(a){
    if(this.len == this.arr.length) this.arr = new Uint8Array([...this.arr, ...Array(this.len || 1)]);
    this.arr[this.len++] = a;
  }

  writeBits(a){
    this.bits += a;

    while(this.bits.length >= 8){
      a = this.bits.substring(0, 8);
      this.bits = this.bits.substring(8);
      this.writeByte(parseInt(a, 2));
    }
  }

  writeBit(a){
    this.write(a, 1);
  }

  write(a, b=null){
    if(b == null) b = (1 << binLen(a)) - 1;

    b = b.toString(2);
    a = a.toString(2).padStart(b.length, '0');

    var eq = true;

    a = [...a].filter((v, i) => {
      if(!eq) return true;
      if(!+b[i]) return false;
      if(!+v) eq = false;
      return true;
    }).join('');

    this.writeBits(a);
  }

  readByte(a){
    if(this.rIndex == this.arr.length) return 0;
    return this.arr[this.rIndex++];
  }

  readBits(a){
    var bits = '';

    while(this.rBits.length < a) this.rBits += this.readByte().toString(2).padStart(8, '0');

    bits = this.rBits.substring(0, a);
    this.rBits = this.rBits.substring(a);

    return bits;
  }

  readBit(){
    return this.read(1);
  }

  read(b = 255){
    var a;

    a = this.readBits(binLen(b));
    b = b.toString(2);

    var eq = true;
    var i = 0;

    b = [...b].map(v => {
      if(!eq) return a[i++];
      if(!+v) return 0;
      if(!+a[i]) eq = false;
      return +a[i++];
    }).join('');

    this.rBits = a.substring(i) + this.rBits;

    return parseInt(b, 2);
  }

  getIndexValue(index, exp){
    var str = ((index + 256) ** exp).toExponential();
    return str.substring(2, 5) & 255;
  }

  pack(){
    if(this.bits) this.writeBits('0'.repeat(8 - this.bits.length));
  }

  getArr(checksum=false){
    var arr = O.ca(this.len + !!this.bits, i => {
      if(i < this.len) return this.arr[i];
      return parseInt(this.bits.padEnd(8, '0'), 2);
    });

    if(!checksum) return arr;

    while(arr.length & 31){
      arr.push(0);
    }

    arr.forEach((byte, index) => {
      arr[index] = byte + this.getIndexValue(index, .9) & 255;
    });

    var csum = O.sha256(arr);

    arr.forEach((byte, index) => {
      var cs = csum[index & 31];
      arr[index] ^= cs ^ this.getIndexValue(index ^ cs, .8);
    });

    return [...arr, ...csum];
  }

  stringify(checksum=false){
    var arr = this.getArr(checksum);

    return arr.map((byte, index) => {
      var newLine = index != arr.length - 1 && !(index + 1 & 31);
      var byteStr = byte.toString(16).toUpperCase().padStart(2, '0');

      return `${byteStr}${newLine ? '\n' : ''}`;
    }).join('');
  }
}

module.exports = BitStream;