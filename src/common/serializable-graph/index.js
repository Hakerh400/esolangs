'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const PTR_SIZE = 8;

const sizeSym = Symbol('size');

class SerializableGraph extends O.Serializable{
  #ctors; #ctorsNum; #ctorsMap;
  #refs; #refsNum; #refsMap;
  #nodes;
  #persts;

  dsr = 0;
  #size = 0;

  constructor(ctors, refs=[], maxSize=null){
    super();

    this.maxSize = maxSize;

    this.#ctors = ctors;
    this.#ctorsNum = ctors.length;
    this.#ctorsMap = new Map();
    ctors.forEach((ctor, index) => {
      this.#ctorsMap.set(ctor, index);
    });

    this.#refs = refs;
    this.#refsNum = refs.length;
    this.#refsMap = new Map();
    refs.forEach((ref, index) => {
      this.#refsMap.set(ref, index);
    });

    this.#nodes = new Set();
    this.#persts = new Set();
  }

  static getName(val, sf=0){
    let str;

    if(val === null){
      str = 'null';
    }else if(typeof val === 'object'){
      if(Array.isArray(val)){
        str = '[]';
      }else{
        const ctor = val.constructor;
        if(ctor) str = ctor.name;
        else str = String(val);
      }
    }else{
      str = String(typeof val);
    }

    if(sf) str = O.sf(str);
    return str;
  }

  ser(ser=new O.Serializer()){
    const lastCtorIndex = this.#ctorsNum - 1;
    const lastRefIndex = this.#refsNum - 1;

    const all = new Set(this.#nodes);
    const done = new Map();
    const queue = [];

    const lastNodeIndex = all.size - 1;
    ser.writeUint(all.size);

    while(all.size !== 0){
      let first = 1;

      queue.push(O.first(all));

      while(queue.length !== 0){
        const node = queue.shift();

        if(node === null){
          ser.write(0);
          continue;
        }else if(!first){
          ser.write(1);
        }

        if(!(node instanceof Node)){
          if(!this.#refsMap.has(node))
            throw new TypeError(`[SER] ${SG.getName(node, 1)} is not a valid graph node or external reference`);
          ser.write(1).write(this.#refsMap.get(node), lastRefIndex);
          continue;
        }
        ser.write(0);

        const seen = done.has(node);
        const index = seen ? done.get(node) : done.size;

        if(first) first = 0;
        else ser.write(index, Math.min(done.size, lastNodeIndex));
        if(seen) continue;

        all.delete(node);
        done.set(node, index);

        const ctor = node.constructor;
        if(!this.#ctorsMap.has(ctor))
          throw new TypeError(`[SER] ${SG.getName(node, 1)} has unrecognized constructor`);

        ser.write(this.#ctorsMap.get(ctor), lastCtorIndex);
        ser.write(node.persistent);
        node.ser(ser);

        const {ptrsNum} = node;
        ser.writeUint(ptrsNum);
        for(let i = 0; i !== ptrsNum; i++)
          queue.push(node[i]);
      }
    }

    return ser;
  }

  deser(ser){
    this.dsr = 1;

    const lastCtorIndex = this.#ctorsNum - 1;
    const lastRefIndex = this.#refsNum - 1;

    const nodes = this.#nodes = new Set();
    const persts = this.#persts = new Set();
    this.size = 0;

    const nodesNum = ser.readUint();
    const lastNodeIndex = nodesNum - 1;

    const done = [];
    const queue = [];

    while(nodes.size !== nodesNum){
      let first = 1;

      while(queue.length !== 0 || first){
        const isNull = first ? 0 : !ser.read();

        if(!isNull && ser.read()){
          const elem = queue[0];
          elem[0][elem[1]++] = this.#refs[ser.read(lastRefIndex)];
          if(elem[1] === elem[0].ptrsNum) queue.shift();
          continue;
        }

        const index = first ? nodes.size : isNull ? -1 : ser.read(Math.min(nodes.size, lastNodeIndex));
        const seen = isNull || index !== nodes.size;
        const node = seen ? isNull ? null : done[index] : new this.#ctors[ser.read(lastCtorIndex)](this);

        if(first){
          first = 0;
        }else{
          const elem = queue[0];
          elem[0][elem[1]++] = node;
          if(elem[1] === elem[0].ptrsNum) queue.shift();
        }

        if(seen) continue;

        done.push(node);
        if(node.persistent = ser.read()) persts.add(node);
        node.deser(ser);

        const ptrsNum = ser.readUint();
        node.ptrsNum = ptrsNum;
        if(ptrsNum !== 0)
          queue.push([node, 0]);
      }
    }

    this.dsr = 0;
    return this;
  }

  get refs(){ return this.#refs; }
  get nodes(){ return this.#nodes; }
  get persts(){ return this.#persts; }
  get main(){ return O.first(this.#persts); }
  get size(){ return this.#size; }

  set size(size){
    const max = this.maxSize;

    if(max !== null && size > max)
      return this.onError();

    this.#size = size;
  }

  has(node){ return this.#nodes.has(node); }

  addNode(node){
    const size = node[sizeSym];

    this.#nodes.add(node);
    this.size += size;

    return this;
  }

  addPersistentNode(node){
    this.addNode(node);
    return this.persist(node);
  }

  persist(node){
    node.persistent = 1;
    return this.#persts.add(node);
  }

  unpersist(node){
    node.persistent = 0;
    return this.#persts.delete(node);
  }

  gc(){
    const sizePrev = this.#size;

    const nodes = new Set();
    const queue = Array.from(this.#persts);
    let size = 0;

    while(queue.length !== 0){
      const node = queue.shift();
      if(!(node instanceof Node) || nodes.has(node)) continue;

      nodes.add(node);
      size += node[sizeSym];

      const {ptrsNum} = node;
      for(let i = 0; i !== ptrsNum; i++){
        const next = node[i];
        if(next === null || nodes.has(next)) continue;

        if(next instanceof Node){
          if(!this.#nodes.has(next)){
            log(node, i);
            throw new TypeError(`[GC] ${SG.getName(next, 1)} is not in the graph`);
          }
        }else{
          if(!this.#refsMap.has(next)){
            log(node, i);
            throw new TypeError(`[GC] ${SG.getName(next, 1)} is not a valid graph node or external reference`);
          }
        }

        queue.push(next);
      }
    }

    for(const node of this.#persts){
      if(nodes.has(node)) continue;
      nodes.add(node);
      size += node[sizeSym];
    }

    this.#nodes = nodes;
    this.#size = size;

    let ss = 0;
    for(const n of this.#nodes)
      ss += n[sizeSym];

    if(size > sizePrev)
      throw new TypeError(`[GC] Graph size after GC is larger than before`);

    return this;
  }

  refresh(){
    this.gc();
    this.reser();
    return this;
  }

  ca(len, func){
    const arr = new Array(this);

    for(let i = 0; i !== len; i++)
      arr.push(func(i));

    return arr;
  }

  log(nodes=this.#nodes){
    log();
    log(nodes.size);
    log(Array.from(nodes).map(node => {
      return `${`${SG.getName(node, 0)}.${node.id}`.padEnd(20)} ${node[sizeSym]}`;
    }).join('\n'));
    return this;
  }

  onError(){
    throw new RangeError('Maximum graph size exceeded');
  }
}

class Node{
  // TODO: delete this
  static id = 0;
  id = Node.id++;

  static ptrsNum = 0;

  persistent = 0;
  #ptrsNum = this.constructor.ptrsNum;
  #size = (this.#ptrsNum + 1) * PTR_SIZE;
  #graph;

  constructor(graph){
    this.#graph = graph;
    graph.addNode(this);
  }

  static keys(keys){
    const proto = this.prototype;
    let index = this.ptrsNum;

    for(const key of keys){
      const i = index++;

      Object.defineProperty(proto, key, {
        get(){ return this[i]; },
        set(a){ return this[i] = a; },
      });
    }

    return index;
  }

  ser(s){}
  deser(s){}

  get graph(){ return this.#graph; }
  get g(){ return this.#graph; }

  get ptrsNum(){ return this.#ptrsNum; }
  set ptrsNum(num){ this[sizeSym] -= (this.#ptrsNum - (this.#ptrsNum = num)) * PTR_SIZE | 0; }

  get [sizeSym](){ return this.#size; }
  set [sizeSym](size){
    if(!this.graph.nodes.has(this)) throw new TypeError(`The graph does not contain "${SG.getName(this, 0)}.${this.id}"`);
    this.graph.size -= this.#size - (this.#size = size) | 0;
  }

  persist(){ this.graph.persist(this); return this; }
  unpersist(){ this.graph.unpersist(this); return this; }

  get name(){ return this.constructor.name; }
}

const SG = SerializableGraph;

module.exports = Object.assign(SG, {
  sizeSym,
  Node,
});