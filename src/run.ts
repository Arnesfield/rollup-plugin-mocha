import Mocha from 'mocha';
import { OutputBundle } from 'rollup';
import { RollupMochaApi, RollupMochaOptions } from './types';

/**
 * Run tests.
 * @param api The API instance.
 * @param bundle The output bundle.
 * @param options The plugin options.
 */
export async function run(
  api: RollupMochaApi,
  bundle: OutputBundle,
  options: RollupMochaOptions
): Promise<void> {
  const mocha = options.instance ? await options.instance() : new Mocha();
  if (!options.cache) {
    api.noCache(mocha);
  }
  const allFiles = api.getFiles(bundle);
  const files = options.filterFiles ? options.filterFiles(allFiles) : allFiles;
  api.addFiles(files, mocha);
  try {
    const runner = mocha.run();
    if (options.runner) await options.runner(runner, mocha);
    await api.run(runner);
  } finally {
    if (options.clear) await api.removeFiles(files);
    if (options.finally) await options.finally(mocha);
  }
}
