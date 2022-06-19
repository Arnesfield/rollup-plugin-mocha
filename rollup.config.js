import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';
import pkg from './package.json';

const input = 'src/index.ts';
const external = Object.keys(pkg.devDependencies).concat('fs', 'path');

export default [
  {
    input,
    output: [
      { file: pkg.main, format: 'cjs', exports: 'named' },
      { file: pkg.module, format: 'esm' }
    ],
    plugins: [esbuild()],
    external
  },
  {
    input,
    output: { file: pkg.types, format: 'esm' },
    plugins: [dts()],
    external
  }
];
