# Esolangs

![](https://api.travis-ci.org/Hakerh400/esolangs.svg?branch=master)

## What is this

This is a collection of interpreters for [esoteric programming languages](https://esolangs.org/wiki/Main_Page).

## How to install

First install [Node.js](https://nodejs.org/en/) version v12.x or newer, then run:

```
npm i eso-langs
```

It will create folder `node_modules` and `eso-langs` inside it.

## How to run

### CLI

To run this program as a console application, open command line, navigate to the `node_modules/eso-langs` directory and type:

```
node index <language> <source> <input> <output>
```

* `<language>` - the ID (not the name) of the esoteric language you want to use. For the list of supported languages and their IDs see [lang-list.json](./lang-list.json).
* `<source>` - path to the file containing the source code of the program you want to run.
* `<input>` - path to the file containing program's standard input.
* `<output>` - path to the file which the program's output will be written into. The file will be overwritten if exists.

If any errors occur, they will be written to the console and the output file will not be created.<br/>

### API

Example of using `eso-langs` in a Node.js application:

```js
'use strict';

const esolangs = require('eso-langs');

const lang = 'brainfuck';
const source = '+[-->-[>>+>-----<<]<--<---]>-.>>>+.>>..+++[.>]<<<<.+++.------.<<-.>>>>+.';
const input = '';
const output = esolangs.run(lang, source, input);

console.log(output.toString() === 'Hello, World!');
```

For the full API documentation, see [api.md](./api.md).

## Contributing

See [contributing.md](./contributing.md).