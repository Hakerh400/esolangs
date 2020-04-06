'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const cs = require('./ctors');

class Engine{
  constructor(parsed, input){
    this.parsed = parsed;
    this.input = input;
    this.output = null;
  }

  run(){
    const {parsed: prog, input} = this;

    /*
      main loop:
        if main pq is empty:
          the statement is not provable from the system
          return

        state = pop from main pq
        equations = equations of the state

        if equations are unsolved:
          try to solve equations up to some point

        if equations are still unsolved:
          put state back to main pq
          continue

        if equations have no solution:
          continue

        if there are no targets:
          the statement is proved
          reconstruct the proof
          return

        target = pop from targets

        for each axiom:
          new state = create a new state based on the current state, target and axiom
          put new state to main pq

      solve equations:
        if state pq is empty:
          no solutions exist
          return

        state = pop from state pq
        equations = equations of the state

        while some equations contain consant on both sides:
          equation = pick one of them (and remove it from the system)

          if equation constants differ:
            no solutions exist
            return

          add n new equations where n is the arity of equation

        if there are no equations or all equations contain variables on both sides:
          assign any value to remaining variables
          solution found
          return

        equation = pick one equation that has a constant on one side (does not remove the equation from the system)
        constant = constant from one side
        variable = variable from the other side

        for i from 1 to arity of variable:
          new state = create a new state based on the current state
          replace all variable occurences in the new state with i-th argument

        new state = create a new state based on the current state
        add n new variables to the new state (where n is the arity of constant)
        replace all variable occurences in the new state with constant applied to corresponding new variables applied to all arguments
    */

    // const e1 = system.rules[0].conclusion;
    // let e2;

    // {
    //   const map = new Map();
    //   let last;

    //   e1.bottomUp(expr => {
    //     const {name} = expr;
    //     const args = expr.args.map(a => map.get(a) || a);

    //     const exprNew = name !== 'f' ?
    //       new cs.Expression(name, args) :
    //       new cs.Expression('A', [
    //         new cs.Expression('g1', args),
    //         new cs.Expression('g2', args),
    //       ]);

    //     map.set(expr, exprNew);
    //     last = exprNew;
    //   });

    //   e2 = last;
    // }

    // log(e1.toString());
    // log(e2.toString());

    log(prog.toString());

    O.exit();

    this.output = Buffer.from(output);
  }
  
  getOutput(){
    return this.output;
  }
}

module.exports = Engine;