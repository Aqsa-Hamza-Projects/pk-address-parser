import {describe, it, expect} from 'vitest';
import {parseAddress, normalizeAddress} from '../src/index.js';

describe('Roman-Urdu house and street labels', () => {
  it('parses the reported Roman-Urdu address', () => {
    const r = parseAddress({address: 'makan no 12 gali 5 johar town lahore'});
    expect(r.house).toBe('12');
    expect(r.street).toBe('5');
    expect(r.area).toBe('Johar Town');
    expect(r.city).toBe('Lahore');
    expect(r.unmatched).toEqual([]);
    expect(r.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('accepts ghar/gali with a repeated "no" label', () => {
    const r = parseAddress({
      address: 'ghar no 7, gali no 3, mohalla islampura, sialkot',
    });
    expect(r.house).toBe('7');
    expect(r.street).toBe('3');
    expect(r.area).toBe('Islampura');
  });

  it('accepts the spelled-out number word and the galli spelling', () => {
    const r = parseAddress({address: 'makan number 4 galli 9 gulberg lahore'});
    expect(r.house).toBe('4');
    expect(r.street).toBe('9');
  });

  it('accepts bangla and lane', () => {
    const r = parseAddress({address: 'bangla 12 lane 4 dha karachi'});
    expect(r.house).toBe('12');
    expect(r.street).toBe('4');
  });

  it('normalizes a Roman-Urdu address to the English form', () => {
    expect(
      normalizeAddress({address: 'makan no 12 gali 5 johar town lahore'})
    ).toBe('House 12, Street 5, Johar Town, Lahore, Punjab, Pakistan');
  });
});

describe('bare locality labels', () => {
  it('drops the orphan mohalla once the area resolved', () => {
    const r = parseAddress({address: 'mohalla islampura sialkot'});
    expect(r.area).toBe('Islampura');
    expect(r.city).toBe('Sialkot');
    expect(r.unmatched).toEqual([]);
  });

  it('keeps the label when the gazetteer found no area', () => {
    const r = parseAddress({address: 'goth allah dino, thatta'});
    expect(r.area).toBe('Goth Allah Dino');
    expect(r.unmatched).toEqual([]);
  });

  it('keeps everything when content remains beside the label', () => {
    const r = parseAddress({address: 'goth ahmed, gulshan-e-iqbal, karachi'});
    expect(r.unmatched).toContain('goth');
    expect(r.unmatched).toContain('ahmed');
  });
});

describe('makaan spelling', () => {
  it('accepts the double-a spelling', () => {
    const r = parseAddress({address: 'makaan 12 gali 5 johar town lahore'});
    expect(r.house).toBe('12');
    expect(r.street).toBe('5');
  });
});
