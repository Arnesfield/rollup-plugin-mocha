import { stat, unlink } from 'fs';
import Mocha from 'mocha';
import { basename, dirname, join } from 'path';
import { NormalizedOutputOptions, OutputBundle } from 'rollup';
import { RollupMochaApi } from './types';

export class RollupMochaApiClass implements RollupMochaApi {
  readonly dir: string;

  constructor(options: NormalizedOutputOptions | undefined) {
    const opts: Partial<NormalizedOutputOptions> = options || {};
    this.dir = opts.dir || (opts.file && dirname(opts.file)) || '';
    Object.defineProperty(this, 'dir', {
      value: this.dir,
      writable: false,
      enumerable: true,
      configurable: false
    });
  }

  instance(): Mocha {
    return new Mocha();
  }

  noCache(mocha: Mocha): this {
    mocha.suite.on('require', (_, file) => delete require.cache[file]);
    return this;
  }

  getFiles(bundle: OutputBundle): string[] {
    const files: string[] = [];
    for (const file in bundle) {
      const output = bundle[file];
      if (output.type === 'chunk') {
        files.push(join(this.dir, file));
      }
    }
    return files;
  }

  addFiles(files: string[], mocha: Mocha): this {
    for (const file of files) {
      mocha.addFile(file);
    }
    return this;
  }

  protected validateFiles(files: string[], force = false): void {
    // make sure files are within the directory
    let didLogDir = false;
    for (const file of files) {
      if (dirname(file).startsWith(this.dir)) {
        continue;
      }
      if (!force) {
        throw new Error(
          `File "${basename(file)}" is outside of the ` +
            `output directory "${this.dir}" and cannot be removed.\n` +
            `\nFile: "${file}"` +
            `\nDirectory: "${this.dir}"`
        );
      } else if (!didLogDir) {
        didLogDir = true;
        console.warn('[mocha] Output directory: %o', this.dir);
      }
      console.warn(
        '[mocha] Deleting file outside of output directory: %o',
        file
      );
    }
  }

  async removeFiles(files: string[], force = false): Promise<void> {
    this.validateFiles(files, force);
    // remove files only after validation
    const promises = files.map(async file => {
      // remove only if file exists
      const exists = await new Promise<boolean>(resolve => {
        stat(file, error => resolve(!error));
      });
      if (!exists) {
        return;
      }
      return new Promise<void>((resolve, reject) => {
        unlink(file, error => (error ? reject(error) : resolve()));
      });
    });
    await Promise.all(promises);
  }

  run(runner: Mocha.Runner): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      runner.on('end', () => {
        const { failures } = runner;
        if (failures === 0) {
          return resolve();
        }
        reject(new Error(`Tests failed: ${failures}`));
      });
    });
  }
}
