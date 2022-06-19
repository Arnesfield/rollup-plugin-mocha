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

With these examples, you can add this script to your `package.json`:

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

> TODO: work in progress

## License

Licensed under the [MIT License](LICENSE).
