# Esolangs

![](https://api.travis-ci.org/Hakerh400/esolangs.svg?branch=master)

This is a collection of interpreters for [esoteric programming languages](https://esolangs.org/wiki/Main_Page).

**Number of languages:** 39

## How to install

First install [Node.js](https://nodejs.org/en/) version v13.x or newer, then run:

```
npm i @hakerh400/esolangs
```

It will create folder `node_modules` and `@hakerh400/esolangs` inside it.

## How to run

### CLI

To run this program as a console application, open command line, navigate to the `node_modules/@hakerh400/esolangs` directory and type:

```
node index <language> <source> <input> <output>
```

* `<language>` - the ID (not the name) of the esoteric language you want to use. For the list of supported languages and their IDs see [esolangs.json](./esolangs.json).
* `<source>` - path to the file containing the source code of the program you want to run.
* `<input>` - path to the file containing program's standard input.
* `<output>` - path to the file which the program's output will be written into. The file will be overwritten if exists.

If any error occurs, it will be written to the console and the output file will not be created.

For languages that support interactive mode (see [api.md](./api.md) for details) you can<br/>
replace `<input> <output>` with `--interactive` flag. The standard input and output will be used instead of files.

### API

Example of using `@hakerh400/esolangs` in a Node.js application:

```js
'use strict';

const esolangs = require('@hakerh400/esolangs');

const lang = 'brainfuck';
const source = '+[-->-[>>+>-----<<]<--<---]>-.>>>+.>>..+++[.>]<<<<.+++.------.<<-.>>>>+.';
const input = '';
const output = esolangs.run(lang, source, input);

console.log(output.toString());
```

For the full API documentation, see [api.md](./api.md).

## Contributing

See [contributing.md](./contributing.md).

# Mirrors

* https://github.com/Hakerh400/esolangs
* https://gitlab.com/Hakerh400/esolangs
* https://bitbucket.org/Hakerh400/esolangs/src/master/