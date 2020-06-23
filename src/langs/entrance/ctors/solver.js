'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../../..');
const format = require('../../../common/format');
const debug = require('../../../common/debug');
const cs = require('.');

const {Base, Comparable, Queue} = cs;

const DEBUG = 0;
const DISPLAY_TIME = 0;
const DISPLAY_STEPS_NUM = 0;

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
    let solution = null;

    const t = O.now;
    let stepsNum = 0;
    // let cnt = 0;

    mainLoop: while(this.len !== 0){
      let state = this.pop();

      stepsNum++;

      // if(stepsNum >= global.MAX){
      //   global.STEPS = null;
      //   return null;
      // }

      innerLoop: while(1){
        const {depth, binding, targets, equations} = state;
        const stateSym = state.symbol;
        const depthNew = depth + 1;

        // if(++cnt === 5e4){
        //   cnt = 0;
        //   log('States: ' + format.num(this.len) + '\n');
        //   log(state.toString());
        //   log(`\n${'='.repeat(100)}\n`);
        // }

        if(DEBUG){
          log(state.toString());
          debug(`\n${'='.repeat(100)}`);
        }

        // If there are no equations
        if(equations.len === 0){
          // If there are no targets
          if(targets.len === 0){
            // Reconstruct the solution
            solution = this.reconstructSolution(binding);
            break mainLoop;
          }

          const target = targets.top();
          const {expr} = target;
          const {type} = expr;

          // If there are only identifier targets
          if(type === 2){
            // Assign 0 to every identifier and reconstruct the solution

            const zero = system.getConst('0');
            const symbols = new Set();
            let b = binding;

            for(const target of targets){
              const sym = target.expr.symbol;
              if(symbols.has(sym)) continue;

              b = new cs.Binding(b, sym, zero);
              symbols.add(sym);
            }

            // const arr = [];
            // for(let s = state; s; s = s.prev)
            //   arr.push(s);
            // while(arr.length !== 0){
            //   const state = arr.pop();
            //   log(state.toString());
            //   debug(`\n${'='.repeat(100)}`);
            // }

            solution = this.reconstructSolution(b);
            break mainLoop;
          }

          // If there is at least one call target
          if(type === 3){
            // Expand the target into new states

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

              const bindingNew = new cs.Binding(binding, expr.symbol, ret);

              const equationsNew = new cs.EquationsQueue();

              if(!equationsNew.push(new cs.Equation(arg, expr.arg)))
                continue funcInfoLoop;

              for(const e of equations)
                equationsNew.push(e);

              const targetsNew = new cs.TargetsQueue();
              targetsNew.push(new cs.Target(ret));

              for(const t of targets)
                if(t !== target)
                  targetsNew.push(t);

              this.push(new State(system, stateSym, bindingNew, depthNew, targetsNew, equationsNew));
            }

            continue mainLoop;
          }

          assert.fail(type);
        }

        // There is at least one equation

        const equation = equations.top();
        const {lhs, rhs} = equation;
        const type1 = lhs.type;
        const type2 = rhs.type;

        // If there is an identifier on the LHS
        if(type1 === 2){
          const sym = lhs.symbol;

          // If there is no call anywhere on the RHS
          if(rhs.callDepth === 0){
            let bindingNew = new cs.Binding(binding, sym, rhs);

            const equationsNew = new cs.EquationsQueue();
            for(const e of equations)
              if(e !== equation && !equationsNew.push(e.subst(sym, rhs)))
                continue mainLoop;

            const targetsNew = new cs.TargetsQueue();

            for(const target of targets){
              const targetNew = target.subst(sym, rhs);

              targetsNew.push(targetNew);
              if(targetNew === target) continue;

              if(target.expr.type === 3)
                bindingNew = new cs.Binding(bindingNew, target.expr.symbol, targetNew.expr);
            }

            state = new State(system, stateSym, bindingNew, depth, targetsNew, equationsNew);
            continue innerLoop;
          }

          // There is a call on the RHS

          assert(type2 === 1);

          const exprNew = rhs.replaceCallsWithIdents();
          let bindingNew = new cs.Binding(binding, sym, exprNew);

          const equationsNew = new cs.EquationsQueue();
          for(const e of equations)
            if(!equationsNew.push(e.subst(sym, exprNew)))
              continue mainLoop;

          const targetsNew = new cs.TargetsQueue();

          for(const target of targets){
            const targetNew = target.subst(sym, exprNew);

            targetsNew.push(targetNew);
            if(targetNew === target) continue;

            if(target.expr.type === 3)
              bindingNew = new cs.Binding(bindingNew, target.expr.symbol, targetNew.expr);
          }

          state = new State(system, stateSym, bindingNew, depth, targetsNew, equationsNew);
          continue innerLoop;
        }

        // If there is a call on the LHS
        if(type1 === 3){
          funcInfoLoop: for(const funcInfo of system.getFuncInfo(lhs.func)){
            const funcInfoInstance = funcInfo.instantiate();
            const arg = funcInfoInstance.fst;
            const ret = funcInfoInstance.snd;

            const equationsNew = new cs.EquationsQueue();
            if(!equationsNew.push(new cs.Equation(arg, lhs.arg)))
              continue funcInfoLoop;
            if(!equationsNew.push(new cs.Equation(ret, rhs)))
              continue funcInfoLoop;

            for(const e of equations)
              if(e !== equation)
                equationsNew.push(e);

            const targetsNew = new cs.TargetsQueue();
            for(const t of targets)
              targetsNew.push(t);

            this.push(new State(system, stateSym, binding, depthNew, targetsNew, equationsNew));
          }

          continue mainLoop;
        }

        assert.fail(type1);
      }
    }

    {
      let newLine = 0;

      if(DISPLAY_TIME){
        newLine = 1;
        const dt = O.now - t;
        log(`Time: ${(dt / 1e3).toFixed(3)}`);
      }

      if(DISPLAY_STEPS_NUM){
        newLine = 1;
        log(`Steps: ${format.num(stepsNum)}`);
      }
      // global.STEPS = stepsNum;

      if(newLine) log();
    }

    return solution;
  }

  reconstructSolution(binding){
    const {system, targetExpr} = this;
    const map = new Map();

    for(let b = binding; b !== null; b = b.prev)
      map.set(b.symbol, b.expr);

    const sStruct = new cs.SolutionStructure(system, targetExpr);
    const stack = [sStruct];

    while(stack.length !== 0){
      const sStruct = stack.pop();
      assert(sStruct.type === 2);

      loop: while(1){
        const expr = sStruct.data;

        switch(expr.type){
          case 0:
            sStruct.finalize(0, []);
            break loop;

          case 1:
            const fst = new cs.SolutionStructure(system, expr.fst);
            const snd = new cs.SolutionStructure(system, expr.snd);
            sStruct.finalize(1, [fst, snd]);
            stack.push(fst, snd);
            break loop;

          case 2: case 3:
            const exprSym = expr.symbol;
            assert(map.has(exprSym));

            const expr1 = map.get(exprSym);
            assert(expr1 !== expr);

            sStruct.data = expr1;
            break;

          default:
            assert.fail(expr.type);
            break;
        }
      }
    }

    return sStruct.toExpr();
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
      depth +
      targets.pri * 0.2/*global.A*/ +
      equations.pri * 1.1/*global.B*/
    );
  }

  cmp(state){
    return this.pri - state.pri;
  }

  toStr(){
    return [
      'State ', this.symbol, ':', this.inc, '\n',
      'previous: ', this.prevSym !== null ? this.prevSym : '/', '\n',
      'depth: ', String(this.depth), '\n',
      ...cs.DISPLAY_PRIORITY ?
        ['priority: ', String(this.pri + .5 | 0), '\n'] : [],
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