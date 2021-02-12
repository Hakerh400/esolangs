'use strict';

const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const parser = require('./parser');

const {min, max} = Math;

const DEBUG = 0;

let identsNum = DEBUG ? 0 : null;

const solve = function*(dnf, vars=null){
  if(vars === null)
    vars = yield [getVars, dnf];

  const varsStr = DEBUG ? O.keys(vars).map(name => {
    return name2str(name);
  }).join(' ') : null;

  if(DEBUG){
    log(`DNF ${varsStr}`);
    log(yield [arr2str, dnf]);
    log.inc();
  }

  systemLoop: for(const system of dnf[1]){
    if(DEBUG){
      log(`SYSTEM ${varsStr}`);
      log(yield [arr2str, [DNF, [system]]]);
      log.inc();
    }

    const eqs = system[1];
    let sol = null;

    solveSystem: {
      if(eqs.length === 0){
        sol = O.obj();

        for(const name of O.keys(vars))
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

          for(const name of O.keys(vars))
            if(!(name in substs))
              varsNew[name] = 1;
        }

        if(extraVars !== null)
          for(const name of extraVars)
            varsNew[name] = 1;

        const systemsNew = [];

        for(let i = 0; i < elimIntrInfo.length; i += 2){
          const [elim=1] = [elimIntrInfo[i]];
          const [intr=[]] = [elimIntrInfo[i + 1]];

          systemsNew.push([SYSTEM, [...intr, ...eqsNew.slice(elim)]]);
        }

        sol = yield [solve, [DNF, systemsNew], varsNew];

        if(sol !== null && substs !== null)
          for(const name of O.keys(substs))
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
        if(DEBUG) log(`---> ${types[t1]} == ${types[t2]}`);

        // TERM == IDENT
        // PAIR == IDENT
        // IDENT == IDENT
        if(t2 === IDENT){
          yield [next];
          break solveSystem;
        }

        if(t2 === TERM){
          // TERM == TERM
          if(t1 === TERM){
            yield [next];
            break solveSystem;
          }

          // PAIR == TERM
          if(t1 === PAIR) break solveSystem;

          // IDENT == TERM
          if(t1 === IDENT){
            const name = lhs[1];
            yield [next, [1, []], {[name]: rhs}];
            break solveSystem;
          }
        }

        if(t2 === PAIR){
          // TERM == PAIR
          if(t1 === TERM) break solveSystem;

          // PAIR == PAIR
          if(t1 === PAIR){
            yield [next, [1, [
              [EQ, lhs[1], rhs[1]],
              [EQ, lhs[2], rhs[2]],
            ]]];

            break solveSystem;
          }

          // IDENT == PAIR
          if(t1 === IDENT){
            yield [nextPair];
            break solveSystem;
          }
        }

        assert.fail(`${types[t1]} == ${types[t2]}`);
      }

      if(eqType === NEQ){
        if(DEBUG) log(`---> ${types[t1]} != ${types[t2]}`);

        // TERM != IDENT
        // PAIR != IDENT
        // IDENT != IDENT
        if(t2 === IDENT) break solveSystem;

        if(t2 === TERM){
          // TERM != TERM
          if(t1 === TERM)
            break solveSystem;

          // PAIR != TERM
          if(t1 === PAIR){
            yield [next];
            break solveSystem;
          }

          // IDENT != TERM
          if(t1 === IDENT){
            yield [nextPair];
            break solveSystem;
          }
        }

        if(t2 === PAIR){
          // TERM != PAIR
          if(t1 === TERM){
            yield [next];
            break solveSystem;
          }

          // PAIR != PAIR
          if(t1 === PAIR){
            yield [next, [
              1, [[NEQ, lhs[1], rhs[1]]],
              1, [[NEQ, lhs[2], rhs[2]]],
            ]];

            break solveSystem;
          }

          // IDENT != PAIR
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

            for(const name of O.keys(vars))
              varsNew[name] = 1;

            varsNew[name1] = 1;
            varsNew[name2] = 1;

            sol = yield [solve, [DNF, systemsNew], varsNew];

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
      if(DEBUG){
        for(let i = 0; i !== 2; i++){
          log(O.keys(sol).join(' '));
          log.dec();
        }
      }

      return sol;
    }

    if(DEBUG){
      log('-');
      log.dec();
    }
  }

  if(DEBUG){
    log('-');
    log.dec();
  }

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
      vars[arr[1]] = 1;
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

    case TERM:
      return arr;
      break;

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
        yield [arr2str, arr[2]]})`;
    } break;

    case TERM: {
      str = '.';
    } break;

    case IDENT: {
      str = name2str(arr[1]);
    } break;

    default:
      assert.fail(types[type]);
      break;
  }

  return str;
};

const parseSystem = str => {
  return [SYSTEM, O.sanl(str.trim()).map(a => parseEqOrNeq(a))];
};

const parseEqOrNeq = str => {
  if(str.includes('=='))
    return parseEq(...str.split('=='));

  return parseNeq(...str.split('!='));
};

const parseEq = (a, b) => {
  return [EQ, parseExpr(a), parseExpr(b)];
};

const parseNeq = (a, b) => {
  return [NEQ, parseExpr(a), parseExpr(b)];
};

const parseExpr = str => {
  const expr = parser.parse(str, 'expr');
  return O.rec([expr, 'toArr']);
};

const arr2expr = arr => {
  return O.rec(cs.Expression.fromArr, arr);
};

const newIdent = () => {
  if(DEBUG) return identsNum++;
  return Symbol();
};

const name2str = name => {
  if(typeof name === 'symbol') return '#';
  return name;
};

module.exports = {
  solve,
  getVars,
  subst,
  arr2str,
  parseSystem,
  parseEqOrNeq,
  parseEq,
  parseNeq,
  parseExpr,
  arr2expr,
  newIdent,
  name2str,
};

const cs = require('./ctors');

const {types} = cs;

const {
  DNF, SYSTEM,
  EQ, NEQ,
  TERM, PAIR, IDENT, CALL,
} = types;