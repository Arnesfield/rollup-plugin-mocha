import { assert } from 'chai';
import mocha from '../src';

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
