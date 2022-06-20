import { OutputBundle } from 'rollup';

/**
 * Rollup Mocha API.
 */
export interface RollupMochaApi {
  /**
   * Output directory path.
   */
  readonly dir: string;
  /**
   * Create a Mocha instance (without options).
   * @returns The Mocha instance.
   */
  instance(): Mocha;
  /**
   * Clear cache from `require.cache` to enable rerunning tests in watch mode.
   * @param mocha The Mocha instance.
   * @returns The API instance.
   * @see https://github.com/mochajs/mocha/issues/995#issuecomment-365441585
   */
  noCache(mocha: Mocha): this;
  /**
   * Get the generated file paths from the output bundle.
   * @param bundle The output bundle.
   * @returns The file paths.
   */
  getFiles(bundle: OutputBundle): string[];
  /**
   * Add files to the Mocha instance.
   * @param files The files to add.
   * @param mocha The Mocha instance.
   * @returns The API instance.
   */
  addFiles(files: string[], mocha: Mocha): this;
  /**
   * Delete files from system. File paths should only be within
   * the output directory (`dir`). Otherwise, an error is thrown.
   * @param files The files to remove.
   * @param force Allow deleting files that are outside of the output directory.
   */
  removeFiles(files: string[], force?: boolean): Promise<void>;
  /**
   * Adds an `end` event listener to the runner.
   * An error is thrown if there are `failures`.
   * @param runner The Mocha Runner.
   */
  run(runner: Mocha.Runner): Promise<void>;
}

/**
 * Rollup Mocha plugin options.
 */
export interface RollupMochaOptions {
  /**
   * Set to `true` to not delete cache from `require.cache`.
   * @see https://github.com/mochajs/mocha/issues/995#issuecomment-365441585
   */
  cache?: boolean;
  /**
   * By default, generated output files are not deleted
   * after running tests. Set to `true` to delete them.
   */
  clear?: boolean;
  /**
   * By default, a Mocha instance is created without options.
   * You can override this and create a Mocha instance with options,
   * register event listeners, and such.
   * @returns The Mocha instance.
   */
  instance?(): Mocha | Promise<Mocha>;
  /**
   * Filter files that will be added to the Mocha instance.
   * @param files The files to filter.
   * @returns The filtered files.
   */
  filterFiles?(files: string[]): string[];
  /**
   * This callback is fired when `mocha.run()` is called.
   * @param runner The Mocha Runner.
   * @param mocha The Mocha instance.
   */
  runner?(runner: Mocha.Runner, mocha: Mocha): void | Promise<void>;
  /**
   * This callback is fired once everything is settled.
   * @param mocha The Mocha instance.
   */
  finally?(mocha: Mocha): void | Promise<void>;
}

/**
 * Rollup Mocha setup callback.
 * @param api The API instance.
 * @param bundle The output bundle.
 */
export type RollupMochaSetup = (
  api: RollupMochaApi,
  bundle: OutputBundle
) => void | Promise<void>;
