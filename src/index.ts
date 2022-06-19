import { unlink } from 'fs';
import Mocha from 'mocha';
import { dirname, join } from 'path';
import { Plugin } from 'rollup';

export interface RollupMochaOptions {
  noClearCache?: boolean;
  instance?(): Mocha | Promise<Mocha>;
  addFiles?(
    fileNames: string[],
    mocha: Mocha
  ): void | string[] | Promise<void | string[]>;
  run?(mocha: Mocha): Promise<void>;
  runner?(
    runner: Mocha.Runner,
    mocha: Mocha,
    resolve: (value: void | PromiseLike<void>) => void,
    reject: (reason?: any) => void
  ): void;
  removeFiles?(fileNames: string[], mocha: Mocha): void | Promise<void>;
  done?(mocha: Mocha): void | Promise<void>;
}

const defaultOptions: Required<Omit<RollupMochaOptions, 'run'>> = {
  noClearCache: false,
  instance: () => new Mocha(),
  addFiles: (files, mocha) => {
    for (const file of files) {
      mocha.addFile(file);
    }
  },
  runner: () => {},
  removeFiles: async files => {
    // remove generated files
    await Promise.all(
      files.map(file => {
        return new Promise<void>((resolve, reject) => {
          unlink(file, error => (error ? reject(error) : resolve()));
        });
      })
    );
  },
  done: () => {}
};

function getOptions(options: RollupMochaOptions): Required<RollupMochaOptions> {
  const keys = [
    'noClearCache',
    'instance',
    'addFiles',
    'runner',
    'removeFiles',
    'done'
  ] as const;

  // set default values
  const opts = {} as Required<RollupMochaOptions>;
  for (const key of keys) {
    opts[key] = (options[key] || defaultOptions[key]) as any;
  }

  opts.run ||= mocha => {
    return new Promise<void>((resolve, reject) => {
      const runner = mocha.run().on('end', () => {
        const { failures } = runner;
        if (failures === 0) {
          return resolve();
        }
        reject(new Error(`Tests failed: ${failures}`));
      });
      opts.runner(runner, mocha, resolve, reject);
    });
  };
  return opts;
}

export default function mocha(options: RollupMochaOptions = {}): Plugin {
  let bundleFiles: string[] = [];
  const opts = getOptions(options);

  async function runTest() {
    const mocha = await opts.instance();

    // enables rerunning tests in watch mode
    // NOTE: taken from https://github.com/mochajs/mocha/issues/995#issuecomment-365441585
    if (!opts.noClearCache) {
      mocha.suite.on('require', (_, file) => {
        delete require.cache[file];
      });
    }

    // copy file names for this call
    const testFiles = Array.from(bundleFiles);
    const result = await opts.addFiles(testFiles, mocha);
    const files = result || testFiles;

    try {
      await opts.run(mocha);
    } finally {
      await opts.removeFiles(files, mocha);
      await opts.done(mocha);
    }
  }

  return {
    name: 'mocha',
    renderStart() {
      bundleFiles = [];
    },
    generateBundle(opts, bundle) {
      const dir = opts.dir || dirname(opts.file || '');
      const names = Object.keys(bundle).map(file => join(dir, file));
      bundleFiles.push(...names);
    },
    writeBundle: runTest
  };
}
