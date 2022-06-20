import esbuild from 'rollup-plugin-esbuild';
import mocha from './_mocha';
import pkg from './package.json';

export default {
  input: 'test/index.spec.ts',
  output: { dir: 'tmp', format: 'cjs', entryFileNames: '[name].cjs' },
  plugins: [mocha({ clear: true }), esbuild()],
  external: Object.keys(pkg.devDependencies).concat('fs', 'path')
};
