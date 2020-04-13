'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const tools = require('./tools');

const args = process.argv.slice(2);

const main = async () => {
  if(args.length === 0)
    O.exit(`Usage: <script>`);

  await tools.run(args[0], args.slice(1));
};

main().catch(O.exit);