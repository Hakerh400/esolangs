'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

class StdIO extends O.EventEmitter{
  constructor(hasMore=1){
    super();

    this.hasMore = hasMore;
  }

  read(len){
    const data = O.Buffer.alloc(Math.ceil(len / 8));
    if(!this.emit('read', data, len)) this.hasMore = 0;
    return data;
  }

  write(data, len=data.length << 3){
    this.emit('write', O.Buffer.from(data), len);
  }
}

module.exports = StdIO;