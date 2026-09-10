import {describe, it, expect} from 'vitest';
import {parseAddress} from '../src/index.js';
import {fixtures} from './fixtures/addresses.js';

describe('parseAddress — spec examples', () => {
  it('House 23, Street 4, Block B, Johar Town, Lahore', () => {
    const r = parseAddress({
      address: 'House 23, Street 4, Block B, Johar Town, Lahore',
    });
    expect(r).toMatchObject({
      house: '23',
      street: '4',
      block: 'B',
      sector: null,
      phase: null,
      unit: null,
      landmark: null,
      area: 'Johar Town',
      city: 'Lahore',
      province: 'Punjab',
      country: 'Pakistan',
      raw: 'House 23, Street 4, Block B, Johar Town, Lahore',
      unmatched: [],
    });
    expect(r.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('DHA Phase 6 Lahore', () => {
    const r = parseAddress({address: 'DHA Phase 6 Lahore'});
    expect(r).toMatchObject({
      phase: '6',
      area: 'DHA',
      city: 'Lahore',
      province: 'Punjab',
      country: 'Pakistan',
    });
    expect(r.confidence).toBeGreaterThanOrEqual(0.5);
  });

  it('Near Emporium Mall, Johar Town, Lahore', () => {
    const r = parseAddress({address: 'Near Emporium Mall, Johar Town, Lahore'});
    expect(r).toMatchObject({
      landmark: 'Near Emporium Mall',
      area: 'Johar Town',
      city: 'Lahore',
      province: 'Punjab',
      country: 'Pakistan',
    });
  });
});

describe('parseAddress — options and edge cases', () => {
  it('uses defaultCity / defaultProvince when unresolved', () => {
    const r = parseAddress({
      address: 'House 5, Some Colony',
      defaultCity: 'Multan',
    });
    expect(r.city).toBe('Multan');
    expect(r.province).toBe('Punjab');
  });
  it('strict mode leaves an unknown locality in unmatched', () => {
    const loose = parseAddress({address: 'Zzz Colony, Lahore'});
    expect(loose.area).toBe('Zzz Colony');
    const strict = parseAddress({address: 'Zzz Colony, Lahore', strict: true});
    expect(strict.area).toBeNull();
    expect(strict.unmatched.join(' ')).toContain('Zzz');
  });
  it('a guessed (non-gazetteer) area keeps confidence low enough to flag', () => {
    const r = parseAddress({
      address: 'some random garbage xyz colony faisalabad',
    });
    expect(r.confidence).toBeLessThanOrEqual(0.6);
  });
  it('a real gazetteer area still scores high', () => {
    const r = parseAddress({address: 'Johar Town Lahore'});
    expect(r.area).toBe('Johar Town');
    expect(r.confidence).toBeGreaterThanOrEqual(0.8);
  });
  it('a bare multi-city society does not infer a city', () => {
    const r = parseAddress({address: 'DHA'});
    expect(r.area).toBe('DHA');
    expect(r.city).toBeNull();
    expect(r.province).toBeNull();
  });
  it('bad input never throws', () => {
    // @ts-expect-error deliberate bad input
    expect(() => parseAddress()).not.toThrow();
    // @ts-expect-error deliberate bad input
    expect(parseAddress().country).toBe('Pakistan');
    // @ts-expect-error deliberate bad input
    expect(parseAddress({address: 42}).raw).toBe('42');
    expect(parseAddress({address: ''}).confidence).toBe(0);
  });
});

describe('parseAddress — landmark geo resolution', () => {
  it('resolves city from a comma-free landmark address', () => {
    const r = parseAddress({address: 'near Packages Mall Walton Road Lahore'});
    expect(r.city).toBe('Lahore');
    expect(r.province).toBe('Punjab');
    expect(r.landmark?.startsWith('Near Packages Mall')).toBe(true);
    expect(r.landmark).not.toContain('Lahore');
  });
  it('comma-separated landmark still works unchanged', () => {
    const r = parseAddress({address: 'Near Emporium Mall, Johar Town, Lahore'});
    expect(r.landmark).toBe('Near Emporium Mall');
    expect(r.area).toBe('Johar Town');
    expect(r.city).toBe('Lahore');
  });
  it('landmark-derived city does not override an explicit one', () => {
    const r = parseAddress({address: 'Near Some Shop, Saddar, Karachi'});
    expect(r.city).toBe('Karachi');
  });
});

describe('parseAddress — fixtures', () => {
  it.each(fixtures)('$input', ({input, expect: want}) => {
    const got = parseAddress({address: input});
    for (const [k, v] of Object.entries(want)) {
      expect(got[k as keyof typeof got]).toEqual(v);
    }
  });
});
