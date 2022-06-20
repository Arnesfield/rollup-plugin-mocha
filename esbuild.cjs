const esbuild = require('esbuild');
const pkg = require('./package.json');

esbuild.build({
  entryPoints: ['src/index.ts'],
  outfile: '_mocha.js',
  bundle: true,
  minify: true,
  format: 'esm',
  platform: 'node',
  target: 'ES2017',
  external: Object.keys(pkg.devDependencies).concat('fs', 'path')
});
