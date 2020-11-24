'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');
const parser = require('./parser');
const cs = require('./ctors');

const {min, max} = Math;

const {types} = cs;

const {
  DNF, SYSTEM,
  EQ, NEQ,
  TERM, PAIR, IDENT,
} = types;

const DEBUG = 1;

let identsNum = DEBUG ? 0 : null;

const run = (src, input) => {
  const prog = parser.parse(src);

  const dnf = [DNF, [
    [SYSTEM, [
      [NEQ, [IDENT, 'x'], [PAIR, [IDENT, 'a'], [PAIR, [TERM], [IDENT, 'b']]]],
      [NEQ, [IDENT, 'x'], [TERM]],
    ]],
  ]];

  const expr = O.rec(solve, dnf);

  O.exit();
};

const solve = function*(dnf, vars=null){
  if(DEBUG){
    log(yield [arr2str, dnf]);
    log.inc();
  }

  if(vars === null)
    vars = yield [getVars, dnf];

  systemLoop: for(const system of dnf[1]){
    const eqs = system[1];
    let sol = null;

    solveSystem: {
      if(eqs.length === 1){
        sol = O.obj();

        for(const name in vars)
          sol[name] = [TERM];

        break solveSystem;
      }

      const eq = eqs[0];
      const eqType = eq[0];
      const lhs = eq[1];
      const rhs = eq[2];
      const t1 = lhs[0];
      const t2 = rhs[0];

      const next = function*(elimIntrInfo=[1, []], substs=null, extraVars=null){
        const eqsNew = eqs.slice();
        const varsNew = substs !== null || extraVars !== null ? O.obj() : vars;

        if(substs !== null){
          for(let i = 0; i !== eqsNew.length; i++)
            eqsNew[i] = yield [subst, eqsNew[i], substs];

          for(const name in vars)
            if(!(name in substs))
              varsNew[name] = 1;
        }

        if(extraVars !== null)
          for(const name of extraVars)
            varsNew[name] = 1;

        const systemsNew = [];

        for(let i = 0; i < elimIntrInfo.length; i += 2){
          const elim = elimIntrInfo[i] ?? 1;
          const intr = elimIntrInfo[i + 1] ?? [];

          systemsNew.push([SYSTEM, [...intr, ...eqsNew.slice(elim)]]);
        }

        if(sol !== null)
          for(const name in substs)
            sol[name] = substs[name];
      };

      const nextPair = function*(){
        const name = lhs[1];
        const name1 = newIdent();
        const name2 = newIdent();

        yield [next, [0, []],
          {[name]: [PAIR, [IDENT, name1], [IDENT, name2]]},
          [name1, name2]];

        if(sol !== null){
          sol[name] = [PAIR, sol[name1], sol[name2]];
          delete sol[name1];
          delete sol[name2];
        }
      };

      if(eqType === EQ){
        log(`---> ${types[t1]} == ${types[t2]}`);

        if(t2 === IDENT){
          yield [next];
          break solveSystem;
        }

        if(t2 === TERM){
          if(t1 === TERM){
            yield [next];
            break solveSystem;
          }

          if(t1 === PAIR) break solveSystem;

          if(t1 === IDENT){
            const name = lhs[1];
            yield [next, [1, []], {[name]: rhs}];
            break solveSystem;
          }
        }

        if(t2 === PAIR){
          if(t1 === TERM) break solveSystem;

          if(t1 === PAIR){
            yield [next, [1, [
              [EQ, lhs[1], rhs[1]],
              [EQ, lhs[2], rhs[2]],
            ]]];

            break solveSystem;
          }

          if(t1 === IDENT){
            yield [nextPair];
            break solveSystem;
          }
        }

        assert.fail(`${types[t1]} == ${types[t2]}`);
      }

      if(eqType === NEQ){
        log(`---> ${types[t1]} != ${types[t2]}`);

        if(t2 === IDENT) break solveSystem;

        if(t2 === TERM){
          if(t1 === TERM) break solveSystem;

          if(t1 === PAIR){
            yield [next];
            break solveSystem;
          }

          if(t1 === IDENT){
            yield [nextPair];
            break solveSystem;
          }
        }

        if(t2 === PAIR){
          if(t1 === TERM){
            yield [next];
            break solveSystem;
          }

          if(t1 === PAIR){
            yield [next, [
              [1, [[NEQ, lhs[1], rhs[1]]]],
              [1, [[NEQ, lhs[2], rhs[2]]]],
            ]];

            break solveSystem;
          }

          if(t1 === IDENT){
            const name = lhs[1];
            const name1 = newIdent();
            const name2 = newIdent();

            const eqs1 = eqs.slice(1);
            const eqs2 = (yield [subst,
              [SYSTEM, eqs],
              {[name]: [PAIR, [IDENT, name1], [IDENT, name2]]},
            ])[1];

            const systemsNew = [
              [SYSTEM, [
                [EQ, [IDENT, name], [TERM]],
                ...eqs1]],
              [SYSTEM, [
                [NEQ, [IDENT, name], [TERM]],
                ...eqs2]],
            ];

            const varsNew = O.obj();

            for(const name in vars)
              varsNew[name] = 1;

            varsNew[name1] = 1;
            varsNew[name2] = 1;

            yield [solve, [DNF, systemsNew], varsNew];

            if(sol !== null){
              if(sol[name][0] === PAIR)
                sol[name] = [PAIR, sol[name1], sol[name2]];

              delete sol[name1];
              delete sol[name2];
            }

            break solveSystem;
          }
        }

        assert.fail(`${types[t1]} != ${types[t2]}`);
      }

      assert.fail(types[eqType]);
    }

    if(sol !== null){
      if(DEBUG) log.dec();
      return sol;
    }
  }

  if(DEBUG) log.dec();
  return null;
};

const getVars = function*(arr, vars=O.obj()){
  const type = arr[0];

  switch(type){
    case DNF: case SYSTEM:
      for(const a of arr[1])
        yield [getVars, a, vars];
      break;

    case EQ: case NEQ:
      yield [getVars, arr[1], vars];
      break;

    case PAIR:
      yield [getVars, arr[1], vars];
      yield [getVars, arr[2], vars];
      break;

    case TERM: break;

    case IDENT:
      vars[IDENT] = 1;
      break;

    default:
      assert.fail(types[type] || type);
      break;
  }

  return vars;
};

const subst = function*(arr, vars=O.obj()){
  const type = arr[0];

  switch(type){
    case DNF: case SYSTEM: {
      const arrNew = [];

      for(const elem of arr[1])
        arrNew.push(yield [subst, elem, vars]);

      return [type, arrNew];
    } break;

    case EQ: case NEQ: {
      return [type, yield [subst, arr[1], vars], arr[2]];
    } break;

    case PAIR: {
      return [PAIR,
        yield [subst, arr[1], vars],
        yield [subst, arr[2], vars],
      ];
    } break;

    case TERM: break;

    case IDENT: {
      const name = arr[1];
      if(name in vars) return vars[name];
      return arr;
    } break;

    default:
      assert.fail(types[type] || type);
      break;
  }
};

const arr2str = function*(arr){
  const type = arr[0];
  let str = '';

  switch(type){
    case DNF: {
      const strs = [];

      for(const system of arr[1])
        strs.push(O.sanl(yield [arr2str, system]));

      const width = strs.reduce((a, b) => b.reduce((a, b) => max(a, b.length), a), 0) + 2;
      const delim = '-'.repeat(width);
      const corner = `+${delim}+`;

      str = `${corner}\n${
        strs.map(a => a.map(a => `| ${
          a.padEnd(width - 2)} |`).join('\n')).join(`\n|${
        delim}|\n`)}\n${corner}`;
    } break;

    case SYSTEM: {
      for(const eq of arr[1]){
        if(str !== '') str += '\n';
        str += yield [arr2str, eq];
      }
      if(str === '') str = '<empty>';
    } break;

    case EQ: case NEQ: {
      str = `${
        yield [arr2str, arr[1]]} ${
        type === EQ ? '==' : '!='} ${
        yield [arr2str, arr[2]]}`;
    } break;

    case PAIR: {
      str = `(${
        yield [arr2str, arr[1]]} ${
        yield [arr2str, arr[2]]})`
    } break;

    case TERM: {
      str = '.';
    } break;

    case IDENT: {
      str = String(arr[1]);
    } break;

    default:
      assert.fail(types[type] || type);
      break;
  }

  return str;
};

const arr2expr = arr => {
  return O.rec(cs.Expression.fromArr, arr);
};

const newIdent = () => {
  if(DEBUG) return identsNum++;
  return Symbol();
};

module.exports = run;