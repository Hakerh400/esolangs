'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../../..');
const debug = require('../../../common/debug');
const cs = require('.');

const {Base, Comparable, Queue} = cs;

const DEBUG = 1;

class Solver extends Queue{
  constructor(system, targetExpr){
    super();

    this.system = system;
    this.targetExpr = targetExpr;

    const targets = new cs.TargetsQueue();
    const equations = new cs.EquationsQueue();

    targets.push(new cs.Target(targetExpr));

    const state = new State(system, null, null, 0, targets, equations);
    this.push(state);
  }

  solve(){
    const {system} = this;

    mainLoop: while(this.len !== 0){
      const state = this.pop();
      const {binding, targets, equations} = state;

      if(DEBUG){
        log(state.toString());
        debug(`\n${'='.repeat(100)}`);
      }

      // If there are no equations
      if(equations.len === 0){
        // If there are no targets
        if(targets.len === 0){
          // Reconstruct the solution
          return this.reconstructSolution(binding);
        }

        const target = targets.top();
        const {expr} = target;
        const {type} = expr;

        // If there are only identifier targets
        if(type === 2){
          // Assign 0 to every identifier and reconstruct the solution

          const zero = system.getConstant('0');
          const symbols = new Set();
          let b = binding;

          for(const target of targets){
            const sym = target.expr.symbol;
            if(symbols.has(sym)) continue;

            b = new Binding(b, sym, zero);
            symbols.add(sym);
          }

          return this.reconstructSolution(binding);
        }

        // If there is at least one call target
        if(type === 3){
          // Expand the target into new states

          targets.pop();

          // Iterate through all definitions for that function
          funcInfoLoop: for(const funcInfo of system.getFuncInfo(expr.func)){
            /*
              For each definition:
                1. Instantiate argument and return value. Instantiating means replacing
                   all formal identifiers with unique new identifiers, so we can work
                   with them and add them to bindings
                2. Create a new binding and assign the instantiated return value to
                   the target expression symbol
                3. Create a new target which contains the instantiated return value
                4. Add a new equation in which the instantiated argument equals to the
                   actual argument of the call. We add equations before targets in order
                   to detect invalid equations early and avoid unnecessary work
                5. Copy all other targets and equations without any substitutions
                6. Create a new state and add it to the queue
            */

            const funcInfoInstance = funcInfo.instantiate();
            const arg = funcInfoInstance.fst;
            const ret = funcInfoInstance.snd;

            const depthNew = state.depth + 1;
            const bindingNew = new cs.Binding(binding, expr.symbol, ret);

            const equationsNew = new cs.EquationsQueue();
            equationsNew.push(new cs.Equation(arg, expr.arg));
            if(equationsNew.invalid) continue funcInfoLoop;

            for(const equation of equations)
              equationsNew.push(equation);

            const targetsNew = new cs.TargetsQueue();
            targetsNew.push(new cs.Target(ret));

            for(const target of targets)
              targetsNew.push(target);

            const stateNew = new State(system, state.symbol, bindingNew, depthNew, targetsNew, equationsNew);
            this.push(stateNew);
          }

          continue;
        }

        assert.fail(type);
      }

      O.noimpl();
    }

    return null;
  }

  toStr(){
    if(this.len === 0) return '/';
    return this.join([], this.arr, '\n\n');
  }
}

class State extends Comparable{
  constructor(system, prevSym, binding, depth, targets, equations){
    super();

    this.system = system;
    this.prevSym = prevSym;
    this.symbol = system.createSymbol();

    this.depth = depth;
    this.binding = binding;
    this.targets = targets;
    this.equations = equations;

    this.pri = (
      depth * 2 +
      targets.pri * 5 +
      equations.pri
    );
  }

  cmp(state){
    return (
      this.depth - state.depth ||
      this.targets.pri - state.targets.pri ||
      this.equations.pri - state.equations.pri
    );
  }

  toStr(){
    return [
      'State ', this.symbol, ':', this.inc, '\n',
      'previous: ', this.prevSym !== null ? this.prevSym : '/', '\n',
      ...cs.DISPLAY_PRIORITY ?
        ['priority: ', String(this.pri), '\n'] : [],
      'binding: ', this.binding !== null ? this.binding : '/', '\n',
      'targets: ', this.targets, '\n',
      'equations: ', this.equations, this.dec,
    ];
  }
}

const ctors = {
  Solver,
  State,
};

Object.assign(cs, ctors);
module.exports = cs;