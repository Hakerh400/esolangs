'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const esolangs = require('../..');

const run = (src, input) => {
  let str = String(src).replace(/\s+/g, '') + O.str2bits(String(input), 1);

  let foundZero = 0;
  let availLast = null;

  const find = (substr, offset=0) => {
    //
    //
    //
    //
    // TODO: f12 should not be matched in f123
    //
    //
    //
    //
    //

    const index = str.indexOf(substr, offset);

    if(index === -1){
      const len = str.length;
      str += substr;
      return len;
    }

    return index;
  };

  const avail = substr => {
    const len1 = str.length;
    const len2 = substr.length;
    const nums = O.obj();

    let offset = 0;

    while(1){
      const index = str.indexOf(substr, offset);
      if(index === -1) break;

      let digits = '';

      for(offset = index + len2; offset !== len1; offset++){
        const char = str[offset];
        if(char < '0' || char > '9') break;
        digits += char;
      }

      if(digits.length === 0) continue;
      nums[BigInt(digits)] = 1;
    }

    for(let i = 0n;; i++)
      if(!(i in nums))
        return availLast = i;
  };

  const max = substr => {
    const len1 = str.length;
    const len2 = substr.length;

    let max = -1n;
    let offset = 0;

    while(1){
      const index = str.indexOf(substr, offset);
      if(index === -1) break;

      let digits = '';

      for(offset = index + len2; offset !== len1; offset++){
        const char = str[offset];
        if(char < '0' || char > '9') break;
        digits += char;
      }

      if(digits.length === 0) continue;
      
      const n = BigInt(digits);
      if(n > max) max = n;
    }

    return max;
  };

  const modify = (str, inc, all=0) => {
    foundZero = 0;

    const reg = all ? /[a-d](\d+)/g : /d(\d+)/g;
    let num = null;

    return str.replace(reg, (a, b) => {
      const n = BigInt(b) + (inc ? 1n : -1n);
      const c = a[0];

      if(n === -1n){
        foundZero = 1;
        if(num === null) num = avail('e');
        return (c === 'a' ? 'e' : c) + num;
      }

      return c + n;
    });
  };

  const inc = (str, all=0) => modify(str, 1, all);
  const dec = (str, all=0) => modify(str, 0, all);

  while(1){
    log(O.match(str, /.\d*/g).map(a => a.padEnd(2)).join(' '));

    if(str.startsWith('d0')){
      const i1 = find('d0', 3);
      const i2 = find('d0', i1 + 2);
      let s1 = str.slice(2, i1);
      let s2 = str.slice(i1 + 2, i2);
      let s3 = str.slice(i2 + 2);

      if(s2.startsWith('c')){
        const c = s2.length !== 1 ? s2[1] : null;
        if(c === null || c < '0' || c > '9'){
          const n = avail('c');
          s2 = `c${n}${s2.slice(1)}`;
          str = `d0${s1}d0${s2}d0${s3}`;
          continue;
        }
      }

      if(/^[bde]/.test(s1)){
        const sj = `j${avail('j')}`;
        str = dec(s1) + 'k' + s3 + sj.repeat(2) + s2 + sj;
        continue;
      }

      if(/^[bde]/.test(s2)){
        const sj = `j${avail('j')}`;
        str = dec(s2) + 'k' + s3 + sj + s1 + sj.repeat(2);
        continue;
      }

      // if(s1.startsWith('e')){
      //   const match = s1.match(/^e\d*/)[0];
      //   const num = BigInt(match.slice(1));
      //   const ss = `f${num}`;
      //   const j1 = find(ss) + ss.length;
      //   const j2 = find(ss, j1);
      //   const sj = inc(str.slice(j1, j2));

      //   s1 = sj + s1.slice(match.length);
      //   str = `d0${s1}d0${s2}d0${s3}`;

      //   if(!str.includes(`e${num}`)){
      //     const j1 = find(ss);
      //     const j2 = find(ss, j1 + ss.length) + ss.length;
      //     str = str.slice(0, j1) + str.slice(j2);
      //   }

      //   continue;
      // }

      // if(s2.startsWith('e')){
      //   const match = s2.match(/^e\d*/)[0];
      //   const num = BigInt(match.slice(1));
      //   const ss = `f${num}`;
      //   const j1 = find(ss, i1 + 2) + ss.length;
      //   const j2 = find(ss, j1);
      //   const sj = inc(str.slice(j1, j2));

      //   s2 = sj + s2.slice(match.length);
      //   str = `d0${s1}d0${s2}d0${s3}`;

      //   if(!str.includes(`e${num}`)){
      //     const j1 = find(ss, i1 + 2);
      //     const j2 = find(ss, j1 + ss.length) + ss.length;
      //     str = str.slice(0, j1) + str.slice(j2);
      //   }

      //   continue;
      // }

      if(s1.startsWith('c')){
        s2 = dec(s2);
        s1 = dec(s1.slice(s1.match(/^c\d*/)[0].length), 1);
        s3 += foundZero ? `f${availLast}${s2}f${availLast}` : '';
        str = s1 + s3;

        //
        //
        //
        //
        // TODO: if(!foundZero){
        //   // Remove references
        // }
        //
        //
        //
        //
        //
        //

        continue;
      }

      if(s1.startsWith('i0')){
        break;
      }

      if(s1.startsWith('i1')){
        break;
      }

      if(s1.startsWith('i2')){
        str = dec(s2) + s3;
        const i = find('h') + 1;
        str = `${str.slice(0, i)}0${str.slice(i)}`;
        continue;
      }

      if(s1.startsWith('i3')){
        str = dec(s2) + s3;
        const i = find('h') + 1;
        str = `${str.slice(0, i)}1${str.slice(i)}`;
        continue;
      }
    }

    if(str.startsWith('e')){
      const match = str.match(/^e\d*/)[0];
      const num = BigInt(match.slice(1));
      const ss = `f${num}`;
      const i1 = find(ss) + ss.length;
      const i2 = find(ss, i1);
      const sj = str.slice(i1, i2);

      str = sj + str.slice(match.length);

      if(!str.includes(`e${num}`)){
        const i1 = find(ss);
        const i2 = find(ss, i1 + ss.length);
        str = str.slice(0, i1) + str.slice(i2 + ss.length);
      }

      continue;
    }

    if(str.startsWith('b')){
      const match = str.match(/^b\d*/)[0];
      const num = BigInt(match.slice(1));
      const ss = `b${num}`;
      const len = ss.length;

      const i1 = find(ss, len);
      const s1 = str.slice(len, i1);
      const s2 = str.slice(i1 + len);

      str = s1 + s2;

      const fss = `f${num}`;
      const fi1 = find(fss);
      const fi2 = find(fss, fi1 + len);
      const fs1 = str.slice(0, fi1);
      const fs2 = str.slice(fi1 + len, fi2);
      const fs3 = str.slice(fi2 + len);

      str = fs1 + fss + s1 + fss + fs3;

      //
      //
      //
      //
      // TODO: {
      //   // Remove references from fs2
      // }
      //
      //
      //
      //
      //
      //

      continue;
    }

    // if(!/^[ci]/.test(str)) break;

    const jmax = max('j');
    if(jmax === -1n) break;

    const k = find('k');
    const ss = inc(str.slice(0, k));

    const sj = `j${jmax}`;
    const len = sj.length;

    const i1 = find(sj);
    const i2 = find(sj, i1 + len);
    const i3 = find(sj, i2 + len);

    let s0 = str.slice(k + 1, i1);
    let s1 = str.slice(i1 + len, i2);
    let s2 = str.slice(i2 + len, i3);
    let s3 = str.slice(i3 + len);

    if(s1 === '') s1 = ss;
    else s2 = ss;

    // log();
    // log(str);
    // log(s0);
    // O.exit();

    let aa = str.split('k').length - 1;
    str = `d0${s1}d0${s2}d0${s0}${s3}`;
    let bb = str.split('k').length - 1;
  }

  const index = find('h');
  const bits = O.rev(str.slice(index).match(/^[01]*/)[0]);

  return O.bits2buf(bits);
};

module.exports = run;