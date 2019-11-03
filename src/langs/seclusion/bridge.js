'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');

const {min, max} = Math;

class StackFrame{
  constructor(n){
    this.times = new Int32Array(n);
    this.indices = new Int32Array(n);
    this.first = 1;
  }
}

const bridge = arr => {
  if(arr.length < 2)
    return [0];

  const nMain = arr.length - 1;
  const mMain = arr[0];

  if(mMain <= 1){
    if(nMain == 1 && mMain == 1)
      return [arr[1]];
    return [];
  }

  const timesMain = O.sortAsc(arr.slice(1));
  const stack = O.ca(nMain, () => new StackFrame(nMain));

  const frame = stack[0];
  frame.n = nMain;
  frame.m = min(nMain, 2);
  frame.cost = 0;
  for(let i = 0; i != nMain; i++)
    frame.times[i] = timesMain[i];

  let costBest = -1;
  let frameIndex = 0;

  while(frameIndex != -1){
    const frame = stack[frameIndex];
    const times = frame.times;
    const indices = frame.indices;
    const n = frame.n;
    const cost = frame.cost;
    let m = frame.m;

    let next = 0;

    if(frame.first)
      for(let i = 0; i != m; i++)
        indices[i] = m - i - 1;

    while(1){
      if(!frame.first){
        if(++indices[0] >= n){
          let i = 0;
          for(;indices[i] >= n - i - 1;) if(++i >= m) { next = 1; break; };
          if(i >= m) { next = 1; break; };
          for(++indices[i]; i; i--) indices[i - 1] = indices[i] + 1;
        }
      }
      frame.first = 0;

      let costNew = 0;
      for(let i = 0; i != m; i++){
        const time = times[indices[i]];
        if(time > costNew) costNew = time;
      }
      costNew += cost;

      if(costBest != -1 && costNew >= costBest) continue;

      if(m != n){
        const frameNew = stack[frameIndex + 1];
        const timesNew = frameNew.times;
        const indicesNew = frameNew.indices;

        const nNew = n - m + 1;
        const mNew = min(nNew, 2);
        let iMain = 0, j = m - 1, k = 0;

        for(let i = 0; i != n; i++){
          if(j == -1 || indices[j] != i){
            const time = times[i];
            if(iMain != -1){
              if(time == timesMain[iMain]){
                iMain++;
              }else{
                costNew += timesNew[k++] = timesMain[iMain];
                indices[m] = iMain;
                iMain = -1;
              }
            }
            timesNew[k++] = time;
          }else{
            j--;
          }
        }

        if(iMain != -1){
          costNew += timesNew[k++] = timesMain[iMain];
          indices[m] = iMain;
        }

        if(costBest != -1 && costNew >= costBest) continue;

        frameNew.n = nNew;
        frameNew.m = mNew;
        frameNew.cost = costNew;
        frameNew.first = 1;

        frameIndex++;
      }else{
        if(costBest == -1 || costNew < costBest)
          costBest = costNew;

        frameIndex--;
      }

      break;
    }

    if(next){
      if(m != min(mMain, n)){
        m = ++frame.m;
        frame.first = 1;
      }else{
        frameIndex--;
      }
    }
  }

  return [costBest];
};

module.exports = bridge;