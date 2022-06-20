import chai, { assert } from 'chai';
import spies from 'chai-spies';
import { stat, unlink, writeFile } from 'fs';
import Mocha from 'mocha';
import { Plugin } from 'rollup';
import mocha, { RollupMochaApi } from '../src';

chai.use(spies);

const file = {
  write(path: string) {
    return new Promise<void>((resolve, reject) => {
      writeFile(path, '', error => (error ? reject(error) : resolve()));
    });
  },
  exists(path: string) {
    return new Promise<boolean>(resolve => {
      stat(path, error => resolve(!error));
    });
  },
  remove(path: string) {
    return new Promise<void>((resolve, reject) => {
      unlink(path, error => (error ? reject(error) : resolve()));
    });
  }
};

interface MockOptions {
  dir?: string;
  file?: string;
}

type MockBundle = Record<string, { type: 'asset' | 'chunk' }>;

function mockMocha() {
  const value = {
    suite: { on: () => {} },
    addFile() {},
    run() {
      return {
        failures: 0,
        on: (_: string, listener: () => void) => setImmediate(() => listener())
      } as unknown as Mocha.Runner;
    }
  };
  return value as unknown as Mocha;
}

function mockBundle(): MockBundle {
  return {
    'index.js': { type: 'chunk' },
    'asset.js': { type: 'asset' },
    'chunk.js': { type: 'chunk' }
  };
}

function run(
  plugin: Plugin,
  options?: MockOptions,
  bundle: MockBundle = { 'index.js': { type: 'chunk' } }
): void | Promise<void> {
  return (plugin as any).writeBundle(options, bundle);
}

describe('mocha', () => {
  it('should be a function', () => {
    assert.isFunction(mocha);
  });

  it('should return an object', () => {
    const plugin = mocha();
    assert.isObject(plugin);
    assert.equal(plugin.name, 'mocha');
    assert.isFunction(plugin.writeBundle);
  });
});

describe('options', () => {
  describe('instance', () => {
    it('should override the default Mocha instance', async () => {
      let called = false;
      const inst = mockMocha();
      chai.spy.on(inst, 'addFile', () => (called = true));
      const plugin = mocha({ instance: () => inst });
      assert.isFalse(called);
      await run(plugin);
      assert.isTrue(called);
    });
  });

  describe('cache', () => {
    it('should clear cache when `false` or not set', async () => {
      let called = false;
      const inst = mockMocha();
      chai.spy.on(inst.suite, 'on', () => (called = true));

      let plugin = mocha({ instance: () => inst });
      assert.isFalse(called);
      await run(plugin);
      assert.isTrue(called);

      called = false;
      plugin = mocha({ cache: false, instance: () => inst });
      assert.isFalse(called);
      await run(plugin);
      assert.isTrue(called);
    });

    it('should skip clear when `true`', async () => {
      let called = false;
      const inst = mockMocha();
      chai.spy.on(inst.suite, 'on', () => (called = true));

      const plugin = mocha({ cache: true, instance: () => inst });
      assert.isFalse(called);
      await run(plugin);
      assert.isFalse(called);
    });
  });

  describe('filterFiles', () => {
    it('should filter files', async () => {
      let called = false;
      let didAdd = false;
      const inst = mockMocha();
      chai.spy.on(inst, 'addFile', file => {
        didAdd = true;
        assert.equal(file, 'index.js');
      });

      const plugin = mocha({
        instance: () => inst,
        filterFiles: files => {
          called = true;
          assert.deepEqual(files, ['index.js', 'chunk.js']);
          return ['index.js'];
        }
      });
      assert.isFalse(called);
      assert.isFalse(didAdd);
      await run(plugin, undefined, mockBundle());
      assert.isTrue(called);
      assert.isTrue(didAdd);
    });
  });

  describe('clear', () => {
    const dir = 'tmp';
    const fileName = '_test.js';
    const path = `${dir}/${fileName}`;
    const runArgs = [{ dir }, { [fileName]: { type: 'chunk' } }] as const;

    it('should not delete files when `false` or not set', async () => {
      await file.write(path);
      assert.isTrue(await file.exists(path));

      let plugin = mocha({ instance: () => mockMocha() });
      await run(plugin, ...runArgs);
      assert.isTrue(await file.exists(path));

      plugin = mocha({ clear: false, instance: () => mockMocha() });
      await run(plugin, ...runArgs);
      assert.isTrue(await file.exists(path));

      await file.remove(path);
      assert.isFalse(await file.exists(path));
    });

    it('should delete files when `true`', async () => {
      await file.write(path);
      assert.isTrue(await file.exists(path));

      const plugin = mocha({ clear: true, instance: () => mockMocha() });
      await run(plugin, ...runArgs);
      assert.isFalse(await file.exists(path));
    });

    it('should delete files with `file` option', async () => {
      await file.write(path);
      assert.isTrue(await file.exists(path));

      const plugin = mocha({ clear: true, instance: () => mockMocha() });
      await run(plugin, { file: path }, runArgs[1]);
      assert.isFalse(await file.exists(path));
    });
  });

  describe('runner', () => {
    it('should fire on `mocha.run()`', async () => {
      let called = false;
      const inst = mockMocha();
      const runner = inst.run();
      chai.spy.on(inst, 'run', () => runner);

      const plugin = mocha({
        instance: () => inst,
        runner: r => {
          called = true;
          assert.equal(r, runner);
        }
      });
      assert.isFalse(called);
      await run(plugin);
      assert.isTrue(called);
    });
  });

  describe('finally', () => {
    it('should fire on finally', async () => {
      let called = false;
      const plugin = mocha({
        instance: () => mockMocha(),
        finally: () => void (called = true)
      });
      assert.isFalse(called);
      await run(plugin);
      assert.isTrue(called);
    });
  });
});

describe('setup', () => {
  it('should override default functionality', () => {
    let called = false;
    const output = {};
    const plugin = mocha((_, bundle) => {
      called = true;
      assert.equal(bundle, output);
    });
    assert.isFalse(called);
    // should be called without awaiting promise
    run(plugin, undefined, output);
    assert.isTrue(called);
  });
});

describe('api', () => {
  function getApi(options?: MockOptions, bundle?: MockBundle) {
    let value: RollupMochaApi = null as any;
    const plugin = mocha(api => void (value = api));
    run(plugin, options, bundle);
    assert.isNotNull(value);
    return value;
  }

  it('should have properties and methods', () => {
    const dir = 'tmp';
    const api = getApi({ dir });
    assert.isObject(api);
    assert.equal(api.dir, dir);
    assert.isFunction(api.addFiles);
    assert.isFunction(api.getFiles);
    assert.isFunction(api.instance);
    assert.isFunction(api.noCache);
    assert.isFunction(api.removeFiles);
    assert.isFunction(api.run);
  });

  describe('dir', () => {
    it('should be a calculated value', () => {
      assert.equal(getApi({ dir: 'tmp' }).dir, 'tmp');
      assert.equal(getApi({ dir: 'tmp/test' }).dir, 'tmp/test');
      assert.equal(getApi({ file: 'tmp/test/index.js' }).dir, 'tmp/test');
    });
  });

  describe('instance', () => {
    it('should return a Mocha instance', () => {
      assert.instanceOf(getApi().instance(), Mocha);
    });
  });

  describe('noCache', () => {
    it('should set up delete cache for `require.cache`', () => {
      let called = false;
      const api = getApi();
      const inst = mockMocha();
      chai.spy.on(inst.suite, 'on', () => (called = true));
      assert.isFalse(called);
      assert.equal(api.noCache(inst), api);
      assert.isTrue(called);
    });
  });

  describe('getFiles', () => {
    it("should get files (type: 'chunk') from bundle", () => {
      const bundle = mockBundle();
      const api = getApi(undefined, bundle);
      const files = api.getFiles(bundle as any);
      assert.deepEqual(files, ['index.js', 'chunk.js']);
    });
  });

  describe('addFiles', () => {
    it('should add files to Mocha instance', () => {
      let called = false;
      const inst = mockMocha();
      chai.spy.on(inst, 'addFile', file => {
        called = true;
        assert.equal(file, 'index.js');
      });

      assert.isFalse(called);
      const api = getApi();
      assert.equal(api.addFiles(['index.js'], inst), api);
      assert.isTrue(called);
    });
  });

  describe('removeFiles', () => {
    const dir = 'tmp';
    const fileName = '_test.js';
    const path = `${dir}/${fileName}`;

    it('should remove files', async () => {
      const path2 = path + 'x';
      await file.write(path);
      assert.isTrue(await file.exists(path));
      await file.write(path2);
      assert.isTrue(await file.exists(path2));

      await getApi({ dir }).removeFiles([path, path + 'x']);
      assert.isFalse(await file.exists(path));
      assert.isFalse(await file.exists(path2));
    });

    it('should throw an error if file to delete is outside the output directory', async () => {
      let error = false;
      try {
        await getApi({ dir }).removeFiles([fileName]);
      } catch {
        error = true;
      }
      assert.isTrue(error);
    });
  });

  describe('run', () => {
    it('should add an `end` event listener to the Mocha Runner', async () => {
      let called = false;
      const runner = mockMocha().run();
      chai.spy.on(runner, 'on', (event: string, listener: () => void) => {
        called = true;
        assert.equal(event, 'end');
        assert.isFunction(listener);
        listener();
      });

      assert.isFalse(called);
      await getApi().run(runner);
      assert.isTrue(called);
    });

    it('should throw an error if runner has failures', async () => {
      const runner = mockMocha().run();
      runner.failures = 1;
      chai.spy.on(runner, 'on', (_, listener: () => void) => listener());

      let error = false;
      try {
        await getApi().run(runner);
      } catch {
        error = true;
      }
      assert.isTrue(error);
    });
  });
});
