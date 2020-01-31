## Importing the module

```js
const esolangs = require('@hakerh400/esolangs');
```

## API functionalities

### Property `esolangs.version`

Version of the module.

### Method `esolangs.getLangs()`

Returns an array containing names of all supported languages sorted alphabetically.

### Method `esolangs.getInfo(name)`

Get information about the language with name `name`. The return value is an object containing properties:

* `name` - Equal to the `name` argument.
* `id` - ID of the language.

Names and IDs are unique among all languages. Besides the above properties, the returned object may also contain these properties:

* `details` - Reference (usually a URL) where more details about the language can be found.
* `async` - Boolean value. If true, a program in that language runs asynchronously and the result is a promise that resolves to a buffer containing the program's output.
* `wip` - Boolean value. If true, the interpreter is still a work-in-progress.

If the language with the given name does not exist in the list of supported languages, the return value is `null`.

### Method `esolangs.getInfoById(id)`

Similar to `esolangs.getInfo(name)`. Returns information about the language with id `id`.

**Note:** IDs are volatile and should not be hardcoded. If you plan to write an automated application for testing different esolangs, you may only hardcode language names, and then get their IDs at runtime.

### Method `esolangs.run(name, source, input)`

Execute the source code `source` that is written in `name` language, having `input` as the string on stdin. `name` is a string, while `source` and `input` can be either strings or buffers. `name` is the language name. The return value is either a buffer or a promise. This method may throw an error.

### Method `esolangs.getStrs()`

Returns an array containing names of all supported common strings sorted alphabetically that are used by various programming languages.

### Method `esolangs.getStr(name)`

Returns common string named `name`. If the string with the given name does not exist, this method returns `null`.