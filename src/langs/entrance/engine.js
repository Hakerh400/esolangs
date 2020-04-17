'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');
const cs = require('./ctors');

const DEBUG = 0;

const anyExpr = cs.Expression.any;

class Engine{
  constructor(parsed){
    this.parsed = parsed;
    this.output = null;
  }

  run(){
    const {parsed: prog} = this;
    const {mode} = prog;
    const varDefs = mode.vars;
    const queue = new O.PriorityQueue();

    const getSol = state => {
      this.output = state.getSolution(varDefs).toString();
    };

    const noSol = () => {
      this.output = 'No solution exists';
    };

    let auxVarsNum = 0n;

    const getAuxName = () => {
      return `_${auxVarsNum++}`;
    };

    // Init the first state
    {
      const vars = new VariablesSet();
      const eqs = new EquationsSystem(vars);

      for(const varDef of mode.vars)
        vars.add(varDef.name, varDef.constraints);

      for(const eq of mode.eqs)
        if(!eqs.push(new Equation(eq.lhs, eq.rhs)))
          return noSol();

      const state = new EquationsSystemState(null, null, eqs);
      if(state.solved) return getSol(state);

      queue.push(state);
    }

    // Main loop
    mainLoop: while(1){
      if(queue.isEmpty){
        return noSol();
      }

      const state = queue.pop();
      const {vars, eqs} = state;

      if(DEBUG) log(state.toString());

      const eq = eqs.top();
      const {lhs, rhs} = eq;
      const lhsArity = lhs.arity;
      const rhsArity = rhs.arity;

      const varName = lhs.name;
      const constraints = vars.get(varName);

      const varsRest = vars.copy();
      varsRest.remove(varName);

      // f(x) -> x
      mode1: for(let i = 0; i !== lhsArity; i++){
        const varsNew = varsRest;

        const binding = new Binding(
          varName,
          cs.Expression.arg(i),
        );

        const eqsNew = eqs.subst(varsNew, binding);
        if(eqsNew === null) continue mode1;

        const stateNew = new EquationsSystemState(state, binding, eqsNew);
        if(stateNew.solved) return getSol(stateNew);
        
        queue.push(stateNew);
      }

      // f(x) = A(B) -> f: A(f1(0))
      mode2: {
        if(rhs.arity === 0 && rhs.name in constraints)
          break mode2;

        const varsNew = varsRest.copy();

        const binding = new Binding(
          varName,
          new cs.Expression(rhs.name, O.ca(rhsArity, i => {
            const name = getAuxName();

            varsNew.add(name, constraints);

            return new cs.Expression(name, O.ca(lhsArity, i => {
              return cs.Expression.arg(i);
            }));
          })),
        );

        const eqsNew = eqs.subst(varsNew, binding);
        if(eqsNew === null) break mode2;

        const stateNew = new EquationsSystemState(state, binding, eqsNew, rhsArity);
        if(stateNew.solved) return getSol(stateNew);
        
        queue.push(stateNew);
      }

      if(DEBUG) debug(`\n${'='.repeat(100)}`);
    }
  }
  
  getOutput(){
    return Buffer.from(this.output);
  }
}

class EquationsSystemState extends O.Comparable{
  constructor(prev, binding, eqs, newVarsNum=0){
    super();

    this.prev = prev;
    this.binding = binding;
    this.vars = eqs.vars;
    this.eqs = eqs;

    this.depth = prev !== null ?
      prev.depth + 1 : 0;

    this.varsTotal = prev !== null ?
      prev.varsTotal + newVarsNum :
      this.vars.size;
  }

  get solved(){ return this.eqs.solved; }

  getSolution(varDefs){
    const sol = new Solution();
    const vars = O.obj();

    for(const name in this.vars.constraints)
      vars[name] = anyExpr;

    let system = this;

    while(system.prev !== null){
      const {binding, prev} = system;

      vars[binding.name] = binding.expr.substVars(vars);
      system = prev;
    }

    for(const varDef of varDefs){
      const {name} = varDef;
      const expr = name in vars ? vars[name] : anyExpr;

      sol.add(new Binding(name, expr));
    }

    return sol;
  }

  isConst(name){
    return !this.vars.has(name);
  }

  isVar(name){
    return this.vars.has(name);
  }

  cmp(state){
    return (
      this.varsTotal - state.varsTotal ||
      this.eqs.len - state.eqs.len ||
      this.vars.size - state.vars.size
    );
  }

  toString(){
    return `${this.vars}\n\n${this.eqs}`;
  }
}

class VariablesSet{
  constraints = O.obj();
  size = 0;

  has(name){
    return name in this.constraints;
  }

  get(name){
    return this.constraints[name];
  }

  add(name, constraints){
    this.constraints[name] = constraints;
    this.size++;
    return this;
  }

  remove(name){
    delete this.constraints[name];
    this.size--;
    return this;
  }

  copy(){
    const varsNew = new VariablesSet();

    varsNew.constraints = Object.assign(O.obj(), this.constraints);
    varsNew.size = this.size;

    return varsNew;
  }

  toString(){
    const {constraints} = this;

    return O.sfa(O.keys(constraints).map(a => {
      if(constraints[a]['#'] !== 0) a += `\\{${O.keys(constraints[a]).filter(a => a !== '#').join(', ')}}`;
      return a;
    }));
  }
}

class Variable{
  constructor(name, constraints){
    this.name = name;
    this.constraints = constraints;
  }
}

class EquationsSystem extends O.PriorityQueue{
  constructor(vars){
    super();

    this.vars = vars;
    this.solved = 1;
  }

  push(eq){
    const {vars} = this;
    const stack = [[eq.lhs, eq.rhs]];

    while(stack.length !== 0){
      const [lhs, rhs] = stack.pop();
      const isLhsVar = vars.has(lhs.name);
      const isRhsVar = vars.has(rhs.name);

      if(isLhsVar){
        const hasConst = !isRhsVar;
        if(hasConst) this.solved = 0;
        super.push(new Equation(lhs, rhs, hasConst));
        continue;
      }

      if(isRhsVar){
        super.push(new Equation(rhs, lhs, 1));
        this.solved = 0;
        continue;
      }

      if(lhs.name === rhs.name){
        const arity = lhs.arity;

        for(let i = 0; i !== arity; i++)
          stack.push([lhs.args[i], rhs.args[i]]);

        continue;
      }

      return 0;
    }

    return 1;
  }

  subst(vars, binding){
    const eqsNew = new EquationsSystem(vars);

    for(const eq of this)
      if(!eqsNew.push(eq.subst(binding)))
        return null;

    return eqsNew;
  }

  toString(){
    return [...this].join('\n');
  }
}

class Equation extends O.Comparable{
  constructor(lhs, rhs, hasConst){
    super();

    this.lhs = lhs;
    this.rhs = rhs;
    this.hasConst = hasConst;
  }

  cmp(eq){
    return (
      eq.hasConst - this.hasConst ||
      this.rhs.arity - eq.rhs.arity ||
      this.lhs.arity - eq.lhs.arity
    );
  }

  subst(binding){
    const varsObj = O.obj();
    varsObj[binding.name] = binding.expr;

    return new Equation(
      this.lhs.substVars(varsObj),
      this.rhs.substVars(varsObj),
    );
  }

  toString(){
    return `${this.lhs} = ${this.rhs}`;
  }
}

class Solution{
  bindings = [];

  add(binding){
    this.bindings.push(binding);
  }

  toString(){
    return this.bindings.join('\n');
  }
}

class Binding{
  constructor(name, expr){
    this.name = name;
    this.expr = expr;
  }

  toString(){
    return `${this.name}: ${this.expr}`;
  }
}

module.exports = Engine;