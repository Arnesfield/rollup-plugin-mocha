# rollup-plugin-mocha

[![npm](https://img.shields.io/npm/v/rollup-plugin-mocha.svg)](https://www.npmjs.com/package/rollup-plugin-mocha)

A Rollup plugin that wraps [mocha](https://github.com/mochajs/mocha).

## Install

```sh
npm install --save-dev mocha rollup-plugin-mocha
```

## Usage

Use the module.

```javascript
// ES6
import mocha from 'rollup-plugin-mocha';

// CommonJS
const mocha = require('rollup-plugin-mocha').default;
```

Example (`rollup-test.config.js`):

```javascript
// rollup-test.config.js
import mocha from 'rollup-plugin-mocha';

export default {
  input: 'test/index.spec.js',
  output: { file: 'tmp/test.cjs', format: 'cjs' },
  plugins: [mocha()]
};
```

Use the plugin with [esbuild](https://github.com/evanw/esbuild) [rollup plugin](https://github.com/egoist/rollup-plugin-esbuild) and [multi-entry](https://github.com/rollup/plugins/tree/master/packages/multi-entry):

```javascript
// rollup-test.config.js
import multi from '@rollup/plugin-multi-entry';
import esbuild from 'rollup-plugin-esbuild';
import mocha from 'rollup-plugin-mocha';

export default {
  // typescript multiple spec files
  // as input under the `test/` directory
  input: 'test/**/**.spec.ts',
  output: { file: 'tmp/test.cjs', format: 'cjs' },
  plugins: [mocha(), multi(), esbuild({ minify: true })]
};
```

With these examples, you can add a script using [rollup](https://github.com/rollup/rollup) to your `package.json`:

```json
{
  "test": "rollup -c rollup-test.config.js"
}
```

Run the tests:

```sh
npm test

# rollup watch mode
npm test -- -w
```

### Plugin Options

You can pass an [options object](#options-object) or a [setup callback](#setup-callback) to the plugin.

#### Options Object

All properties are optional.

```typescript
mocha({
  /**
   * Set to `true` to not delete cache from `require.cache`.
   */
  cache: false,

  /**
   * By default, generated output files are not deleted
   * after running tests. Set to `true` to delete them.
   */
  clear: false,

  /**
   * Create Mocha instance.
   */
  instance: () => new Mocha(),

  /**
   * Filter files that will be added to the Mocha instance.
   */
  filterFiles: (files: string[]) => files,

  /**
   * This callback is fired when `mocha.run()` is called.
   */
  runner: (runner: Mocha.Runner, mocha: Mocha) => {},

  /**
   * This callback is fired once everything is settled.
   */
  finally: (mocha: Mocha) => {}
});
```

If you want to have full control over how the plugin runs the test, you can use a [setup callback](#setup-callback).

#### Setup Callback

By default, this is how it would look like:

```typescript
// api instance and output bundle are passed
mocha(async (api: RollupMochaApi, bundle: OutputBundle) => {
  const mocha = api.instance(); // or create Mocha instance yourself
  const files = api.getFiles(bundle); // or get the files yourself
  api
    .noCache(mocha) // sets up cache delete from `require.cache`
    .addFiles(files, mocha); // or add files yourself
  try {
    await api.run(mocha.run()); // or handle `mocha.run()` yourself
  } finally {
    await api.removeFiles(files); // or remove files yourself
  }
});
```

An [API instance](#api-instance) is passed to the [setup callback](#setup-callback).

### API Instance

The **API instance** contains the wrapper logic to run the plugin.

- `dir: string`

  The output directory path.

  ```javascript
  console.log(api.dir);
  ```

- `instance(): Mocha`

  Returns a `Mocha` instance (without options).

  ```javascript
  const mocha = api.instance();
  ```

- `noCache(mocha: Mocha): this`

  Clears cache from `require.cache` to enable rerunning tests in Rollup watch mode.

  > Note that this is taken from a [GitHub comment](https://github.com/mochajs/mocha/issues/995#issuecomment-365441585), thank you for this!

  ```javascript
  api.noCache(mocha);
  ```

  If it does not work for you, you can handle this yourself.

- `getFiles(bundle: OutputBundle): string[]`

  Returns the generated file paths from the output bundle.

  ```javascript
  api.getFiles(bundle);
  ```

- `addFiles(files: string[], mocha: Mocha): this`

  Add files to the Mocha instance (`mocha.addFile(file)`).

  ```javascript
  api.addFiles(files, mocha);
  ```

- `removeFiles(files: string[], force?: boolean): Promise<void>`

  Delete files from system. File paths should only be within the output directory (`api.dir`). Otherwise, an error is thrown.

  ```javascript
  await api.removeFiles(files);
  ```

  Allow deleting files that are outside of the output directory by passing `true` to the `force` param.

  ```javascript
  await api.removeFiles(files, true);
  ```

- `run(runner: Mocha.Runner): Promise<void>`

  Adds an `end` event listener to the runner. An error is thrown if there are `failures`.

  ```javascript
  await api.run(mocha.run());
  ```

## License

Licensed under the [MIT License](LICENSE).
