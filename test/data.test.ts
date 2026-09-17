import {describe, it, expect} from 'vitest';
import provinces from '../src/data/provinces.json' with {type: 'json'};
import cities from '../src/data/cities.json' with {type: 'json'};
import areas from '../src/data/areas.json' with {type: 'json'};
import overrides from '../scripts/build-data/overrides.json' with {type: 'json'};

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

  it('plain "Latifabad" is its own record, not an alias of Unit 10', () => {
    const hits = areas.areas.filter((a: {name: string; aliases: string[]}) =>
      [a.name, ...a.aliases].some((n) => n.toLowerCase() === 'latifabad')
    );
    expect(hits).toHaveLength(1);
    expect(hits[0]?.name).toBe('Latifabad');
    expect(hits[0]?.city).toBe('Hyderabad');
  });

  it('the numbered Latifabad records are untouched', () => {
    // 96 real area names contain "number". Nothing strips or rewrites it.
    const names = new Set(
      areas.areas.map((a: {name: string}) => a.name.toLowerCase())
    );
    for (const n of [
      'latifabad number ten',
      'latifabad number seven',
      'latifabad number four',
      'latifabad unit number two',
    ]) {
      expect(names.has(n)).toBe(true);
    }
    const withNumber = areas.areas
      .flatMap((a: {name: string; aliases: string[]}) => [a.name, ...a.aliases])
      .filter((n: string) => /\bnumber\b/i.test(n));
    expect(withNumber.length).toBeGreaterThan(90);
  });

  it('no curated override area name survives as another record’s alias in a city it claims', () => {
    // Generator invariant: within a city an override lists, the curated name
    // outranks a GeoNames alternate name. Scoped per (name, city) — "Model
    // Town" is an override for Lahore but a legitimate alias of "New Town" in
    // Hyderabad, and that one must survive.
    const claimed = new Set<string>();
    for (const o of (overrides as {areas: {name: string; cities: string[]}[]})
      .areas)
      for (const c of o.cities)
        claimed.add(`${o.name.toLowerCase()}|${c.toLowerCase()}`);
    const offenders = areas.areas.filter(
      (a: {city: string; aliases: string[]}) =>
        a.aliases.some((al) =>
          claimed.has(`${al.toLowerCase()}|${a.city.toLowerCase()}`)
        )
    );
    expect(offenders).toEqual([]);
  });

  it('an override name still resolves in cities the override does not claim', () => {
    // Guards the scoping above against being widened back to a global drop.
    const newTown = areas.areas.find(
      (a: {name: string; city: string}) =>
        a.name === 'New Town' && a.city === 'Hyderabad'
    );
    expect(newTown?.aliases).toContain('Model Town');
  });
});
