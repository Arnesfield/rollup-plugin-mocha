# rollup-plugin-mocha

[![npm](https://img.shields.io/npm/v/rollup-plugin-mocha.svg)](https://www.npmjs.com/package/rollup-plugin-mocha)

A Rollup plugin wrapper for [Mocha](https://github.com/mochajs/mocha).

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

Use the plugin with [esbuild](https://github.com/evanw/esbuild) [Rollup plugin](https://github.com/egoist/rollup-plugin-esbuild) and [multi-entry](https://github.com/rollup/plugins/tree/master/packages/multi-entry):

```javascript
// rollup-test.config.js
import multi from '@rollup/plugin-multi-entry';
import esbuild from 'rollup-plugin-esbuild';
import mocha from 'rollup-plugin-mocha';

export default {
  // typescript multiple spec files
  // as input under the `test/` directory
  input: 'test/**/**.spec.ts',
  output: { dir: 'tmp', format: 'cjs', entryFileNames: '[name].cjs' },
  plugins: [mocha(), multi(), esbuild({ minify: true })]
};
```

With these examples, you can add a script using [Rollup](https://github.com/rollup/rollup) to your `package.json`:

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
  try {
    await api
      .noCache(mocha) // sets up cache delete from `require.cache`
      .addFiles(files, mocha) // or add files yourself
      .run(mocha.run()); // or handle `mocha.run()` yourself
  } finally {
    await api.removeFiles(files); // or remove files yourself
  }
});
```

An [API instance](#api-instance) is passed to the [setup callback](#setup-callback).

### API Instance

The **API instance** contains the wrapper logic that runs the plugin by default.

```typescript
interface RollupMochaApi {
  /**
   * Output directory path.
   */
  readonly dir: string;

  /**
   * Create a Mocha instance (without options).
   */
  instance(): Mocha;

  /**
   * Clear cache from `require.cache` to enable rerunning tests in watch mode.
   * @see https://github.com/mochajs/mocha/issues/995#issuecomment-365441585
   */
  noCache(mocha: Mocha): this;

  /**
   * Get the generated file paths from the output bundle.
   */
  getFiles(bundle: OutputBundle): string[];

  /**
   * Add files to the Mocha instance.
   */
  addFiles(files: string[], mocha: Mocha): this;

  /**
   * Delete files from system. File paths should only be within
   * the output directory (`dir`). Otherwise, an error is thrown.
   */
  removeFiles(files: string[], force?: boolean): Promise<void>;

  /**
   * Adds an `end` event listener to the runner.
   * An error is thrown if there are `failures`.
   */
  run(runner: Mocha.Runner): Promise<void>;
}
```

To sum up:

```javascript
// log output directory
console.log(api.dir);

// create instance (without options)
const mocha = api.instance();

// apply no cache
api.noCache(mocha);

// get files from bundle
const files = api.getFiles(bundle);

// add files to Mocha instance
api.addFiles(files, mocha);

// add `end` event listener, throws an error if tests have `failures`
await api.run(mocha.run());

// delete files
await api.removeFiles(files, force);
```

## License

Licensed under the [MIT License](LICENSE).
