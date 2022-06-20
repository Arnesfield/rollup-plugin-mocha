import { Plugin } from 'rollup';
import { RollupMochaApiClass } from './api';
import { run } from './run';
import { RollupMochaOptions, RollupMochaSetup } from './types';

/**
 * Wrap Mocha with a Rollup plugin.
 * @returns The plugin.
 */
export function mocha(): Plugin;

/**
 * Wrap Mocha with a Rollup plugin.
 * @param setup Callback to manually setup Mocha. Should throw an error if tests fail.
 * @returns The plugin.
 */
export function mocha(setup: RollupMochaSetup): Plugin;

/**
 * Wrap Mocha with a Rollup plugin.
 * @param options The plugin options.
 * @returns The plugin.
 */
export function mocha(options: RollupMochaOptions): Plugin;

export function mocha(
  pluginOpts: RollupMochaSetup | RollupMochaOptions = {}
): Plugin {
  const setup: RollupMochaSetup =
    typeof pluginOpts === 'function'
      ? pluginOpts
      : (api, bundle) => run(api, bundle, pluginOpts);
  return {
    name: 'mocha',
    writeBundle(options, bundle) {
      return setup(new RollupMochaApiClass(options), bundle);
    }
  };
}
