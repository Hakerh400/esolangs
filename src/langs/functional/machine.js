'use strict';

const O = require('omikron');
const tokenizer = require('./tokenizer');
const parser = require('./parser');
const compiler = require('./compiler');
const BitStream = require('./bit-stream');

const {Identifier, List, CallChain} = parser;

const DEFAULT_MAX_STACK_SIZE = Infinity;

class Machine{
  constructor(compiled){
    if(!(compiled instanceof Buffer)){
      var src = compiled;
      var tokenized = tokenizer.tokenize(src);
      var parsed = parser.parse(tokenized);

      compiled = compiler.compile(parsed);
    }

    this.compiled = compiled;
    this.parsed = Machine.parse(compiled);

    this.paused = 0;
    this.error = 0;

    this.stack = [];

    var idents = O.obj();
    this.idents = idents;

    this.funcs = [
      // 0
      cbInfo => {
        if(!cbInfo.evald) return cbInfo.args;
        return cbInfo.getArg(1);
      },

      // 1
      cbInfo => {
        if(!cbInfo.evald) return cbInfo.args;
        return cbInfo.getArg(0);
      },

      // ==
      cbInfo => {
        if(!cbInfo.evald) return cbInfo.args;
        var same = cbInfo.getArg(0) === cbInfo.getArg(1);
        return cbInfo.getIdent(0, same | 0);
      },

      // =
      cbInfo => {
        if(!cbInfo.evald){
          cbInfo.data = cbInfo.getId(0);
          return cbInfo.args;
        }

        var id = cbInfo.data;
        if(id === null) return;

        var func = cbInfo.getArg(1);
        cbInfo.setIdent(1, id, func);

        return func;
      },

      // var
      cbInfo => {
        if(!cbInfo.evald){
          cbInfo.data = cbInfo.getId(0);
          return cbInfo.args;
        }

        var id = cbInfo.data;
        if(id === null) return;

        var func = cbInfo.getArg(1);
        cbInfo.setIdent(1, id, func, 1);

        return func;
      },

      // []
      cbInfo => {
        if(!cbInfo.evald){
          var valid = 1;

          var formalArgs = O.ca(cbInfo.argsNum, i => {
            var id = cbInfo.getId(i);
            if(id === null) valid = 0;
            return id;
          });

          cbInfo.data = valid ? formalArgs : null;

          return cbInfo.args;
        }

        var formalArgs = cbInfo.data;
        if(formalArgs === null) return;

        return cbInfo => {
          var identsArr = cbInfo.identsArr.slice();
          var body = cbInfo.args.clone(0);

          body.reduce = 1;

          return cbInfo => {
            if(!cbInfo.evald) return cbInfo.args;

            var newIdents = O.obj();

            formalArgs.forEach((id, index) => {
              newIdents[id] = cbInfo.getArg(index);
            });

            var newIdentsArr = identsArr.slice();
            newIdentsArr.push(newIdents);

            var newBody = body.clone(0);

            return new UserlandFunctionCall(newIdentsArr, newBody);
          };
        };
      },
    ];

    this.funcs.forEach((func, index) => {
      idents[index] = func;
      func.identsArr = [idents];
    });
  }

  static parse(compiled){
    var bs = new BitStream(compiled);
    var identsNum = 0;

    var stack = [new List()];
    var first = 0;

    while(1){
      var elem = top();

      if(first){
        first = 0;
      }else{
        var bit = rb();

        if(bit === 0){
          if(stack.length === 1)
            break;

          var elem = stack.pop();
          top().push(elem);

          continue;
        }
      }

      if(elem.isList()){
        var id;

        if(identsNum === 0) id = 0;
        else id = bs.read(identsNum);

        if(id === identsNum)
          identsNum++;

        var ident = new Identifier(id);
        var call = new CallChain(ident);

        stack.push(call);
      }else{
        stack.push(new List());
      }
    }

    return stack[0];

    function top(){
      return stack[stack.length - 1];
    }

    function rb(){
      return bs.readBit();
    }
  }

  addFunc(func){
    var {funcs, idents} = this;

    idents[funcs.length] = func;
    funcs.push(func);

    func.identsArr = [idents];
  }

  *start(maxStackSize=DEFAULT_MAX_STACK_SIZE, ticksNum=0){
    var {funcs, idents} = this;

    var arr = this.parsed.arr.slice();
    var stack = this.stack = [new EvalList(arr, 1)];
    var lastFunc = new EvalList(arr.slice(-1), 1);

    var baseCbInfo = new CallbackInfo([idents], O.nop, new EvalList([]));
    var mainCbInfo = new CallbackInfo([idents], O.nop, new EvalList([]));

    var loop = ticksNum !== 0;
    var tickIndex = 0;

    mainLoop: while(1){
      if(stack.length > maxStackSize){
        this.error = 1;
        return;
      }

      if(loop){
        if(this.paused){
          this.paused = 0;
          yield;
        }

        if(tickIndex++ === ticksNum){
          tickIndex = 0;
          yield;
        }

        if(stack.length === 0){
          stack.push(lastFunc.clone(0));
          yield;
        }
      }else{
        if(stack.length === 0)
          break;
      }

      var elem = stack[stack.length - 1];

      if(elem instanceof EvalList){
        while(!elem.evald){
          var e = elem.get();
          var func = mainCbInfo.getIdent(1, e.ident.id);

          if(e.arr.length === 0){
            elem.set(func);
            continue;
          }

          stack.push(new EvalCallChain(func, e.arr.slice()));
          continue mainLoop;
        }

        stack.pop();

        if(!elem.reduce){
          stack[stack.length - 1].set(elem);
          continue;
        }

        if(stack.length !== 0){
          var result = elem.result;
          if(result === null) result = baseCbInfo.getIdent(1, 0);

          var userFunc = stack[stack.length - 1];
          mainCbInfo.identsArr = userFunc.identsArrPrev;

          stack[stack.length - 1] = result;

          continue;
        }

        continue;
      }

      if(elem instanceof EvalCallChain){
        if(elem.evald){
          stack.pop();
          stack[stack.length - 1].set(elem.func);
          continue;
        }

        var func = elem.func;
        var args = new EvalList(elem.get().arr.slice());
        var cbInfo = new CallbackInfo(mainCbInfo.identsArr.slice(), func, args);

        stack.push(cbInfo);
        
        continue;
      }

      if(elem instanceof CallbackInfo){
        var result = elem.call();
        if(result === null) continue;

        if(result instanceof Function || result instanceof UserlandFunctionCall){
          stack[stack.length - 1] = result;
          continue;
        }

        stack.push(result);

        continue;
      }

      if(elem instanceof UserlandFunctionCall){
        elem.identsArrPrev = mainCbInfo.identsArr;
        mainCbInfo.identsArr = elem.identsArr;

        if(stack.length !== 3){
          var userFunc = stack[stack.length - 4];

          if(userFunc instanceof UserlandFunctionCall){
            var e1 = stack[stack.length - 3];
            var e2 = stack[stack.length - 2];

            if(e1.reduce && e1.arr.length === 1 && e2.arr.length === 1){
              elem.identsArrPrev = userFunc.identsArrPrev;
              stack.splice(stack.length - 4, 3);
            }
          }
        }

        stack.push(elem.body);
      }

      if(elem instanceof Function){
        stack.pop();
        stack[stack.length - 1].set(elem);
        continue;
      }
    }
  }

  pause(){
    this.paused = 1;
  }

  resume(){
    this.paused = 0;
  }
};

class EvalList{
  constructor(arr, reduce=0){
    this.arr = arr;
    this.reduce = reduce;
    this.index = 0;

    this.evald = arr.length === 0;
    this.result = null;
  }

  clone(deep){
    var {arr} = this;

    if(deep) arr = arr.map(a => a.clone(1));
    else arr = arr.slice();

    return new EvalList(arr, this.reduce);
  }

  get(){
    return this.arr[this.index];
  }

  set(val){
    var {arr} = this;

    if(this.reduce){
      arr.shift();
      this.evald = arr.length === 0;
    }else{
      arr[this.index++] = val;
      this.evald = this.index === arr.length;
    }

    if(this.evald)
      this.result = val;
  }

  toString(){
    return `LIST: ${this.arr.join(',')}`;
  }
};

class EvalCallChain{
  constructor(func, arr){
    this.func = func;
    this.arr = arr;

    this.evald = arr.length === 0;
  }

  clone(deep){
    var {arr} = this;

    if(deep) arr = arr.map(a => a.clone(1));
    else arr = arr.slice();

    return new EvalCallChain(this.func, arr);
  }

  get(){
    return this.arr[0];
  }

  set(val){
    this.func = val;
    this.arr.shift();
    this.evald = this.arr.length === 0;
  }

  toString(){
    return `CALL_CHAIN: ${this.func}${this.arr.join('')}`;
  }
};

class CallbackInfo{
  constructor(identsArr, func, args){
    this.identsArr = identsArr;
    this.func = func;
    this.args = args;

    this.argsNum = args.arr.length;
    this.evald = 0;
    this.data = null;
  }

  call(){
    var result = this.func(this);
    if(result == null) return this.getIdent(0, 0);
    return result;
  }

  get(){
    return this.args;
  }

  set(evaldList){
    this.args = evaldList;
    this.evald = 1;
  }

  getId(index){
    var {arr} = this.args;
    if(index < 0 || index >= arr.length) return null;
    if(arr[index].arr.length !== 0) return null;
    return arr[index].ident.id;
  }

  getArg(index){
    var {arr} = this.args;
    if(index < 0 || index >= arr.length) return this.getIdent(0, 0);
    return arr[index];
  }

  getIdent(type, id){
    var identsArr = type === 0 ? this.func.identsArr : this.identsArr;
    if(!identsArr) identsArr = [this.identsArr[0]];

    for(var i = identsArr.length - 1; i !== -1; i--){
      var idents = identsArr[i];

      if(id in idents)
        return idents[id];
    }

    return identsArr[0][0];
  }

  setIdent(type, id, val, force){
    var identsArr = type === 0 ? this.func.identsArr : this.identsArr;

    for(var i = identsArr.length - 1; i !== -1; i--){
      var idents = identsArr[i];

      if(force || id in idents){
        idents[id] = val;
        return;
      }
    }

    identsArr[0][id] = val;
  }

  toString(){
    return `CB_INFO: ${this.func}(${this.args})`;
  }
};

class UserlandFunctionCall{
  constructor(identsArr, body){
    this.identsArrPrev = null;

    this.identsArr = identsArr;
    this.body = body;
  }

  toString(){
    return `USER_FUNC: ${this.body}`;
  }
};

module.exports = Machine;