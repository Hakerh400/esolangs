'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const {ArrayList} = require('@hakerh400/list');
const esolangs = require('../..');

class Queue extends ArrayList{
  states = 0;

  constructor(state){
    assert(state.isState);
    super([state]);
  }

  get hasStates(){ return this.states !== 0; }

  push(elem){
    if(elem.isState){
      this.states++;
    }else{
      assert(elem.isTran);
    }

    super.push(elem);
  }

  shift(){
    const elem = super.shift();

    if(elem.isState){
      this.states--;
    }else{
      assert(elem.isTran);
    }

    return elem;
  }
}

module.exports = Queue;