'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const O = require('omikron');

const hash = (data, hashType='sha512', encoding=null) => {
  const hash = crypto.createHash(hashType);
  hash.update(data);

  let result = hash.digest();
  if(encoding !== null) result = result.toString(encoding);

  return result;
};

module.exports = hash;