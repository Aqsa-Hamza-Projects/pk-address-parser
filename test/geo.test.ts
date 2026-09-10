import {describe, it, expect} from 'vitest';
import {
  getProvince,
  getCity,
  listProvinces,
  listCities,
  listAreas,
  isProvince,
  isCity,
} from '../src/index.js';

describe('getProvince', () => {
  it('resolves a known city, alias-aware and case-insensitive', () => {
    expect(getProvince({city: 'Lahore'})).toBe('Punjab');
    expect(getProvince({city: 'lahore'})).toBe('Punjab');
    expect(getProvince({city: 'KHI'})).toBe('Sindh');
  });
  it('returns null for unknown or bad input', () => {
    expect(getProvince({city: 'Gotham'})).toBeNull();
    // @ts-expect-error bad input
    expect(getProvince()).toBeNull();
    // @ts-expect-error bad input
    expect(getProvince({})).toBeNull();
  });
});

describe('getCity', () => {
  it('canonicalizes when the city is in the province', () => {
    expect(getCity({province: 'Punjab', city: 'lahore'})).toBe('Lahore');
    expect(getCity({province: 'punjab', city: 'LHR'})).toBe('Lahore');
  });
  it('returns null when the city is not in that province', () => {
    expect(getCity({province: 'Sindh', city: 'Lahore'})).toBeNull();
    expect(getCity({province: 'Punjab', city: 'Gotham'})).toBeNull();
    // @ts-expect-error bad input
    expect(getCity()).toBeNull();
  });
});

describe('listProvinces', () => {
  it('returns exactly the 7 canonical names in order', () => {
    expect(listProvinces()).toEqual([
      'Punjab',
      'Sindh',
      'Khyber Pakhtunkhwa',
      'Balochistan',
      'Islamabad Capital Territory',
      'Azad Jammu & Kashmir',
      'Gilgit-Baltistan',
    ]);
  });
});

describe('listCities', () => {
  it('no args → many cities; filtered → subset all in that province', () => {
    expect(listCities().length).toBeGreaterThan(120);
    const sindh = listCities({province: 'Sindh'});
    expect(sindh).toContain('Karachi');
    expect(sindh).not.toContain('Lahore');
  });
  it('unknown province → []', () => {
    expect(listCities({province: 'Nowhere'})).toEqual([]);
  });
});

describe('listAreas', () => {
  it('returns localities for a known city', () => {
    expect(listAreas({city: 'Lahore'})).toContain('Johar Town');
  });
  it('unknown city or bad input → []', () => {
    expect(listAreas({city: 'Nowhere'})).toEqual([]);
    // @ts-expect-error bad input
    expect(listAreas()).toEqual([]);
  });
});

describe('isProvince / isCity', () => {
  it('alias-aware booleans', () => {
    expect(isProvince({name: 'KPK'})).toBe(true);
    expect(isProvince({name: 'Karachi'})).toBe(false);
    expect(isCity({name: 'karachi'})).toBe(true);
    expect(isCity({name: 'Punjab'})).toBe(false);
  });
});
