'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const esolangs = require('../..');
const debug = require('../../common/debug');
const cs = require('./ctors');

const DEBUG = 0;

class Engine{
  constructor(parsed){
    this.parsed = parsed;
    this.output = null;
  }

  run(){
    const cmds = this.parsed.cmds.slice();

    // The main loop
    mainLoop: while(1){
      if(DEBUG){
        log(cmds.join(' '));
      }

      // Find the first active command
      for(let i = 0; i !== cmds.length; i++){
        const cmd = cmds[i];
        if(cmd.isPassive) continue;

        assert(cmd.isActive);
        const {name} = cmd;

        // Open bracket
        if(cmd instanceof cs.OpenBracket){
          // Count number of "+" commands before it with the same name
          let num = 0;
          for(let j = 0; j !== i; j++){
            const cmd = cmds[j];
            if(cmd instanceof cs.Plus && cmd.name === name)
              num++;
          }

          // Find the matching closed bracket
          let index = -1;
          let depth = 0;
          for(let j = i + 1; j !== cmds.length; j++){
            const cmd = cmds[j];

            if(cmd instanceof cs.OpenBracket)
              depth++;

            if(cmds[j] instanceof cs.ClosedBracket){
              if(depth !== 0){
                depth--;
                continue;
              }

              index = j;
              break;
            }
          }
          if(index === -1)
            esolangs.err(`Missing closed bracket\n\n${cmds.join(' ')}`);

          // Extract the content between the brackets
          const content = cmds.slice(i + 1, index);
          cmds.splice(i, index - i + 1);

          // Repeat the content
          for(let j = 0; j !== num; j++)
            for(let k = content.length - 1; k !== -1; k--)
              cmds.splice(i, 0, content[k]);

          continue mainLoop;
        }

        // Equals sign
        if(cmd instanceof cs.EqualsSign){
          // Remove this command
          cmds.splice(i, 1);

          // Remove all passive commands with the same name before it
          for(let j = i - 1; j !== -1; j--){
            const cmd = cmds[j];
            if(cmd.isPassive && cmd.name === name)
              cmds.splice(j, 1);
          }
          continue mainLoop;
        }

        // Exclamation mark
        if(cmd instanceof cs.ExclamationMark){
          // Remove this command
          cmds.splice(i, 1);

          let index = i;

          // Add all "*" commands before it, but with "*" removed
          for(let j = 0; j !== i; j++){
            const cmd = cmds[j];
            if(cmd instanceof cs.Asterisk && cmd.name === name)
              cmds.splice(index++, 0, cmd.cmd);
          }

          // Add a copy of all passive commands with the same name
          for(let j = 0; j !== i; j++){
            const cmd = cmds[j];
            if(cmd.isPassive && cmd.name === name)
              cmds.splice(index++, 0, cmd);
          }

          // Remove all passive commands with the same name before it
          for(let j = i - 1; j !== -1; j--){
            const cmd = cmds[j];
            if(cmd.isPassive && cmd.name === name)
              cmds.splice(j, 1);
          }

          continue mainLoop;
        }

        assert.fail(cmd);
      }

      break;
    }

    if(DEBUG){
      O.exit();
    }

    this.output = Buffer.from(String(cmds.length)/*.join(' ')*/);
  }
  
  getOutput(){
    return this.output;
  }
}

module.exports = Engine;