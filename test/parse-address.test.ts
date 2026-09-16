import {describe, it, expect} from 'vitest';
import {parseAddress, normalizeAddress} from '../src/index.js';
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

describe('parseAddress — phone extraction (PR-A1)', () => {
  it('extracts a trailing mobile instead of guessing it as an area', () => {
    const r = parseAddress({
      address: 'House 5 St 3 G-11/2 Islamabad 0300-1234567',
    });
    expect(r).toMatchObject({
      house: '5',
      street: '3',
      sector: 'G-11/2',
      phone: '03001234567',
      area: null,
      city: 'Islamabad',
      unmatched: [],
    });
  });

  it('keeps the phone out of the normalized string', () => {
    const s = normalizeAddress({
      address: 'House 5 St 3 G-11/2 Islamabad 0300-1234567',
    });
    expect(s).not.toContain('0300');
    expect(s).toContain('Sector G-11/2');
  });

  it('finds a phone that trails a landmark segment', () => {
    const r = parseAddress({
      address: 'near Emporium Mall, Johar Town, Lahore, 0321-9876543',
    });
    expect(r.phone).toBe('03219876543');
    expect(r.landmark).toContain('Emporium');
  });

  it('is null when there is no phone', () => {
    expect(parseAddress({address: 'Johar Town, Lahore'}).phone).toBeNull();
  });

  it('is null for empty input', () => {
    expect(parseAddress({address: ''}).phone).toBeNull();
  });
});

describe('parseAddress — a leftover becomes area only when it looks like one (PR-A1)', () => {
  it('sends a second floor descriptor to unmatched, not area', () => {
    const r = parseAddress({
      address: 'Flat 3, 2nd Floor, near Aabpara, Sector G-6/2, Islamabad',
    });
    expect(r).toMatchObject({
      unit: 'Flat 3',
      sector: 'G-6/2',
      area: null,
      city: 'Islamabad',
      unmatched: ['2nd', 'Floor'],
    });
  });

  it('still guesses a genuine unknown locality', () => {
    const r = parseAddress({address: 'House 4, Gulshan-e-Somewhere, Lahore'});
    expect(r.area).toBe('Gulshan-E-Somewhere');
    expect(r.city).toBe('Lahore');
  });

  it('sends a bare number to unmatched', () => {
    const r = parseAddress({address: 'House 4, 12345, Lahore'});
    expect(r.area).toBeNull();
    expect(r.unmatched).toContain('12345');
  });
});
