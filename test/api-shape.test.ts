import {describe, it, expect} from 'vitest';
import * as api from '../src/index.js';

describe('named-parameters contract', () => {
  it('parseAddress requires an object; bare/absent args are safe', () => {
    // @ts-expect-error deliberate bad input
    expect(() => api.parseAddress()).not.toThrow();
    // @ts-expect-error deliberate bad input
    expect(() => api.parseAddress('House 23, Lahore')).not.toThrow();
    // @ts-expect-error deliberate bad input
    expect(api.parseAddress('House 23, Lahore').city).toBeNull();
    expect(api.parseAddress({address: ''}).country).toBe('Pakistan');
  });

  it('normalizeAddress is safe on bad input', () => {
    // @ts-expect-error deliberate bad input
    expect(api.normalizeAddress()).toBe('');
  });

  it('geo helpers return falsy/empty on missing object', () => {
    // @ts-expect-error deliberate bad input
    expect(api.getProvince()).toBeNull();
    // @ts-expect-error deliberate bad input
    expect(api.getCity()).toBeNull();
    // @ts-expect-error deliberate bad input
    expect(api.listAreas()).toEqual([]);
    // @ts-expect-error deliberate bad input
    expect(api.isProvince()).toBe(false);
    // @ts-expect-error deliberate bad input
    expect(api.isCity()).toBe(false);
    expect(api.listCities()).toBeInstanceOf(Array);
    expect(api.listProvinces()).toHaveLength(7);
  });

  it('exports exactly the documented surface', () => {
    expect(Object.keys(api).sort()).toEqual(
      [
        'getCity',
        'getProvince',
        'isCity',
        'isProvince',
        'listAreas',
        'listCities',
        'listProvinces',
        'normalizeAddress',
        'parseAddress',
      ].sort()
    );
  });
});
