## Importing the module

```js
const esolangs = require('@hakerh400/esolangs');
```

## Properties

### `esolangs.version`

Version of the module.

### `esolangs.debugMode`

Default is `false`. When set to `true`, errors that are related to user programs will be displayed differently than internal errors and will terminate the process immediately (except in `runSafe` method).

## Methods

### `esolangs.getLangs()`

Returns an array containing names of all supported languages sorted alphabetically.

### `esolangs.getInfo(name)`

Get information about the language with name `name`. The return value is an object containing properties:

* `name` - Equal to the `name` argument.
* `id` - ID of the language.

Names and IDs are unique among all languages. Besides the above properties, the returned object may also contain these properties:

* `details` - Reference (usually a URL) where more details about the language can be found.
* `async` - Boolean value. If true, a program in that language runs asynchronously and the result is a promise that resolves to a buffer containing the program's output.
* `wip` - Boolean value. If true, the interpreter is still a work-in-progress.

If the language with the given name does not exist in the list of supported languages, the return value is `null`.

### `esolangs.getInfoById(id)`

Similar to `esolangs.getInfo(name)`. Returns information about the language with id `id`.

**Note:** IDs are volatile and should not be hardcoded. If you plan to write an automated application for testing different esolangs, you may only hardcode language names, and then get their IDs at runtime.

### `esolangs.run(name, source, input[, options])`

Execute the source code `source` that is written in `name` language, having `input` as the string on stdin. `name` is a string, while `source` and `input` can be either strings or buffers. `name` is the language name. The return value is either a buffer or a promise. This method may throw an error.

`options` is an optional argument. It specified, it must be an object containing options for specific interpreter. Options are currently not documented.

### `esolangs.runSafe(name, source, input[, options[, sandboxOptions]])`

Safe version of `esolangs.run`. While the unsafe version may never halt and can even crash the process if a fatal error occurs (for example out-of-memory errors cannot be catched - they always crash the process), the `runSafe` method is always safe to invoke. It is always asynchronous (regardless of the `async` property of the langauge info object) and returns a promise that either resolves to a buffer containing the result or rejects with an error.

Result is an array of two elements. If the first element is `0`, the second element is a string representing the error message. If the first element is `1`, the second element is a buffer that represents the program's output. Promise rejects with an error only in case of fatal errors (for example time limit is exceeded, or out-of-memory happened (which cannot be catched using `esolangs.run`)).

`sandboxOptions` is an optional parameter which is an object that contains the following properties:

* `timeout` - Time interval in milliseconds. After that interval, if the program is still running, it will be terminated and the promise will be rejected. Default is `null` (unlimited time).

### `esolangs.getStrs()`

Returns an array containing names of all supported common strings sorted alphabetically that are used by various programming languages.

### `esolangs.getStr(name)`

Returns common string named `name`. If the string with the given name does not exist, this method returns `null`.

## Classes

### `esolangs.Sandbox`

Method `esolangs.runSafe` is very slow (because it instantiates `esolangs.Sandbox` on each call). This class is exposed to make running programs in safe mode much faster.

#### `Sandbox.maxInstancesNum`

Static property that says what is the maximum number of alive instances of the `Sandbox` class. It is there for safety to prevent out-of-memory errors. If the maximum number of instances is reached, trying to instantiate a new object before disposing some of the instantiated ones will raise an exception.

Default value is `3`. If set to `null`, no checks will be performed on instantiation.

#### `new Sandbox()`

Instantiates a new `sandbox` object.

#### `sandbox.run(name, source, input[, options[, sandboxOptions]])`

Behaves exactly the same as `esolangs.runSafe`.

#### `sandbox.refresh()`

Refresh the sandbox. Usually, this has no observable effects.

#### `sandbox.dispose()`

This method must be called after the `sandbox` object is no longer needed.