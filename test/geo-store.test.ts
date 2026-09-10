import {describe, it, expect} from 'vitest';
import {getStore, normalizeKey} from '../src/geo/store.js';

describe('normalizeKey', () => {
  it('lowercases, strips punctuation, collapses whitespace', () => {
    expect(normalizeKey('  Gulshan-e-Iqbal ')).toBe('gulshan e iqbal');
    expect(normalizeKey('D.H.A')).toBe('dha');
  });

  it('folds diacritics', () => {
    expect(normalizeKey('Muzaffarābād')).toBe(normalizeKey('Muzaffarabad'));
  });
});

describe('getStore', () => {
  it('indexes provinces by name and alias', () => {
    const s = getStore();
    expect(s.provinceByKey.get(normalizeKey('Punjab'))?.name).toBe('Punjab');
    expect(s.provinceByKey.get(normalizeKey('KPK'))?.name).toBe(
      'Khyber Pakhtunkhwa'
    );
    expect(s.provinceByKey.get(normalizeKey('AJK'))?.name).toBe(
      'Azad Jammu & Kashmir'
    );
  });

  it('indexes cities by name and alias, allowing multiples', () => {
    const s = getStore();
    const lhr = s.cityByKey.get(normalizeKey('LHR'));
    expect(lhr?.some((c) => c.name === 'Lahore')).toBe(true);
  });

  it('indexes areas, DHA present in several cities', () => {
    const s = getStore();
    const dha = s.areaByKey.get(normalizeKey('DHA')) ?? [];
    const cities = new Set(dha.map((a) => a.city));
    expect(cities.has('Lahore')).toBe(true);
    expect(cities.has('Karachi')).toBe(true);
  });

  it('returns the same cached instance', () => {
    expect(getStore()).toBe(getStore());
  });
});
