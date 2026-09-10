import {describe, it, expect} from 'vitest';
import provinces from '../src/data/provinces.json' with {type: 'json'};
import cities from '../src/data/cities.json' with {type: 'json'};
import areas from '../src/data/areas.json' with {type: 'json'};

const CANON = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad Capital Territory',
  'Azad Jammu & Kashmir',
  'Gilgit-Baltistan',
];

describe('bundled gazetteer', () => {
  it('provinces.json lists exactly the 7 canonical provinces', () => {
    expect(
      provinces.provinces.map((p: {name: string}) => p.name).sort()
    ).toEqual([...CANON].sort());
  });
  it('cities.json is non-trivial and every city has a known province', () => {
    expect(cities.cities.length).toBeGreaterThan(120);
    for (const c of cities.cities) expect(CANON).toContain(c.province);
  });
  it('areas.json is non-trivial and every area points at a real city name', () => {
    expect(areas.areas.length).toBeGreaterThan(2000);
    const cityNames = new Set(
      cities.cities.map((c: {name: string}) => c.name.toLowerCase())
    );
    const orphans = areas.areas.filter(
      (a: {city: string}) => !cityNames.has(a.city.toLowerCase())
    );
    expect(orphans).toEqual([]);
  });
  it('known landmarks resolve', () => {
    const areaNames = new Set(
      areas.areas.map((a: {name: string}) => a.name.toLowerCase())
    );
    expect(areaNames.has('johar town')).toBe(true);
    const cityNames = new Set(
      cities.cities.map((c: {name: string}) => c.name.toLowerCase())
    );
    expect(cityNames.has('lahore')).toBe(true);
    expect(cityNames.has('karachi')).toBe(true);
  });
});
