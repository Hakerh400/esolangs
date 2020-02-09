'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');

const listenerTypes = [
  'end',
  'finish',
  'destroy',
  'error',
];

const read = async (st, encoding=null) => {
  const read = len => new Promise((res, rej) => {
    if(len === 0) return res(Buffer.alloc(0));

    let rejected = 0;

    const wrap = func => {
      return (...args) => {
        for(const type of listenerTypes)
          st.removeListener(type, reject);

        return func(...args);
      };
    };

    const reject = () => {
      if(rejected) return;
      rejected = 1;
      rej(new TypeError('Cannot read chunk because there is not enough data'));
    };

    for(const type of listenerTypes)
      st.on(type, reject);

    res = wrap(res);
    rej = wrap(rej);

    const tryToRead = () => {
      const buf = st.read(len);

      if(buf === null)
        return st.once('readable', tryToRead);

      st.removeListener('finish', reject);
      st.removeListener('destroy', reject);
      st.removeListener('error', reject);

      if(buf.length !== len)
        return reject();

      res(buf);
    };

    tryToRead();
  });


  const len = (await read(4)).readUInt32LE();
  const buf = await read(len, 1);

  if(encoding !== null) return buf.toString(encoding);
  return buf;
};

const write = (st, buf) => {
  const header = Buffer.alloc(4);

  buf = Buffer.from(buf);
  header.writeUInt32LE(buf.length);

  st.write(header);
  st.write(buf);
};

module.exports = {
  read,
  write,
};