import {describe, it, expect} from 'vitest';
import {resolveGeo} from '../src/parser/geo-resolve.js';

describe('resolveGeo', () => {
  it("resolves 'Johar Town Lahore' to area + city + inferred province", () => {
    const r = resolveGeo('Johar Town Lahore');
    expect(r.area).toBe('Johar Town');
    expect(r.city).toBe('Lahore');
    expect(r.province).toBe('Punjab');
    expect(r.leftover).toEqual([]);
  });
  it('resolves a bare city and infers the province', () => {
    const r = resolveGeo('lahore');
    expect(r.city).toBe('Lahore');
    expect(r.province).toBe('Punjab');
  });
  it('matches the longest multi-word locality', () => {
    expect(resolveGeo('DHA Lahore').area).toBe('DHA');
    expect(resolveGeo('Gulshan-e-Iqbal Karachi').area).toBe('Gulshan-e-Iqbal');
  });
  it('a multi-city society with no city token infers neither city nor province', () => {
    const r = resolveGeo('DHA');
    expect(r.area).toBe('DHA');
    expect(r.city).toBeNull();
    expect(r.province).toBeNull();
  });
  it('a city token still resolves a multi-city society to that city', () => {
    const r = resolveGeo('DHA Lahore');
    expect(r.area).toBe('DHA');
    expect(r.city).toBe('Lahore');
    expect(r.province).toBe('Punjab');
  });
  it('prefers the area record matching the resolved city', () => {
    const r = resolveGeo('DHA Karachi');
    expect(r.area).toBe('DHA');
    expect(r.city).toBe('Karachi');
    expect(r.province).toBe('Sindh');
  });
  it('keeps unresolved tokens in leftover', () => {
    const r = resolveGeo('Qwerty Street extension Lahore');
    expect(r.city).toBe('Lahore');
    expect(r.leftover.join(' ').toLowerCase()).toContain('qwerty');
  });
  it('applies defaultCity / defaultProvince only when unresolved', () => {
    const r = resolveGeo('Some Unknown Place', {defaultCity: 'Multan'});
    expect(r.city).toBe('Multan');
    expect(r.province).toBe('Punjab');
  });
  it('explicit values beat defaults', () => {
    const r = resolveGeo('Karachi', {defaultCity: 'Multan'});
    expect(r.city).toBe('Karachi');
  });
  it('resolves Islamabad as both city and province', () => {
    const r = resolveGeo('Islamabad');
    expect(r.city).toBe('Islamabad');
    expect(r.province).toBe('Islamabad Capital Territory');
  });
  it('resolves an Islamabad sector address to the city', () => {
    const r = resolveGeo('Blue Area Islamabad');
    expect(r.city).toBe('Islamabad');
    expect(r.province).toBe('Islamabad Capital Territory');
    expect(r.area).toBe('Blue Area');
  });
  it('prefers a city-matching area over a longer non-matching one', () => {
    const r = resolveGeo('Model Town North Nazimabad Karachi');
    expect(r.city).toBe('Karachi');
    expect(r.area).toBe('North Nazimabad');
  });
  it('empty input → all null', () => {
    expect(resolveGeo('')).toEqual({
      province: null,
      city: null,
      area: null,
      leftover: [],
    });
  });
});
