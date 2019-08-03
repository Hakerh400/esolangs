## Requiring the module

```js
const esolangs = require('eso-langs');
```

## API functionalities

### Property `esolangs.version`

Version of the module.

### Method `esolangs.getLangs()`

Returns an array containing names of all supported languages sorted alphabetically.

### Method `esolangs.getInfo(name)`

Get information about the language with name `name`. The return value is an object containing properties:

* `name` - Equal to the `name` argument
* `id` - ID of the language
* `version` version of the emulator for that language
* `details` - reference (usually a URL) where more details about the language can be found.

Names and IDs are unique among all languages. If the language with the given name does not exist in the list of supported languages, the return value is `null`.

### Method `esolangs.run(name, source, input)`

Execute the source code `source` that is written in `name` language, having `input` as the string on stdin. `name` is a string, while `source` and `input` can be either strings or buffers. `name` is the language name. The return value is always a buffer. This method may throw an error.

### Method `esolangs.getStrs()`

Returns an array containing names of all supported common strings sorted alphabetically that are used by various programming languages.

### Method `esolangs.getStr(name)`

Returns common string named `name`. If the string with the given name does not exist, this method returns `null`.