'use strict';

const O = require('omikron');
const BitStream = require('./bit-stream');

module.exports = {
  compile,
};

function compile(parsed){
  var bs = new BitStream();

  var identsArr = [];
  var identsObj = O.obj();

  var stack = [parsed.list];
  var first = 1;

  while(stack.length !== 0){
    var elem = stack.pop();

    if(elem === null){
      wb(0);
      continue;
    }

    if(first) first = 0;
    else wb(1);

    if(elem.isCall()){
      var len = identsArr.length;

      var {ident, arr} = elem;
      var id = ident.id;

      if(!(id in identsObj)){
        if(identsArr.length !== 0)
          bs.write(len, len);

        identsObj[id] = len;
        identsArr.push(id);
      }else{
        bs.write(identsObj[id], len);
      }
    }

    stack.push(null);
    stack = stack.concat(elem.arr.reverse());
  }

  bs.pack();

  var arr = bs.getArr();
  while(arr[arr.length - 1] === 0)
    arr.pop();

  return Buffer.from(arr);

  function wb(a){
    bs.writeBit(a);
  }
}