'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');

const strs = O.resObj({
  ['hello-world'](){
    return 'Hello, World!';
  },

  ['99-bottles'](){
    let str = '';

    for(let i = 99; i !== 1; i--)
      str += `${i} bottles of beer on the wall, ${i} bottles of beer.\n` +
        `Take one down and pass it around, ${i - 1} bottle${i !== 2 ? 's' : ''} of beer on the wall.\n\n`;

    str += `1 bottle of beer on the wall, 1 bottle of beer.\n` +
      `Take one down and pass it around, no more bottles of beer on the wall.\n\n` +
      `No more bottles of beer on the wall, no more bottles of beer.\n` +
      `Go to the store and buy some more, 99 bottles of beer on the wall.`;

    return str;
  },

  ['fizz-buzz'](){
    let str = '';

    for(let i = 0; i !== 100; i++){
      if(i !== 0) str += '\n';

      const j = i + 1;

      if(j % 15 === 0) str += 'FizzBuzz';
      else if(j % 3 === 0) str += 'Fizz';
      else if(j % 5 === 0) str += 'Buzz';
      else str += j;
    }

    return str;
  },
});

const names = O.sortAsc(O.keys(strs));

module.exports = {
  names,
  strs,
};