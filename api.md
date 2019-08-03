## Requiring the module

```js
const esolangs = require('eso-langs');
```

## API functionalities

### Property `esolangs.version`

Version of the module.

### Method `esolangs.getInfo(lang)`

Get information about the language with name `lang`. The return value is an object containing properties:

* `id` - ID of the language
* `version` version of the emulator for that language
* `details` - reference (usually a URL) where more details about the language can be found.

If the language with the given name does not exist in the list of supported languages, the return value is `null`.

### Method `esolangs.run(lang, source, input)`

Execute the source code `source` that is written in `lang` language, having `input` as the string on stdin. `lang` is a string, while `source` and `input` can be either strings or buffers. `lang` is full language name, not the language ID. The return value is always a buffer. This method may throw an error.