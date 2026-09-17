import {describe, it, expect} from 'vitest';
import {parseAddress, normalizeAddress} from '../src/index.js';

describe('chak numbering', () => {
  it('captures the canal-branch forms', () => {
    expect(parseAddress({address: 'Chak No. 123/GB, Faisalabad'}).chak).toBe(
      '123/GB'
    );
    expect(parseAddress({address: 'Chak 45/JB, Faisalabad'}).chak).toBe(
      '45/JB'
    );
    expect(parseAddress({address: 'Chak 7/1-L, Okara'}).chak).toBe('7/1-L');
    expect(parseAddress({address: 'Chak # 66/5-L, Sahiwal'}).chak).toBe(
      '66/5-L'
    );
  });

  it('captures a bare chak number and upper-cases the branch', () => {
    expect(parseAddress({address: 'Chak 123, Faisalabad'}).chak).toBe('123');
    expect(parseAddress({address: 'chak no 45/jb, faisalabad'}).chak).toBe(
      '45/JB'
    );
  });

  it('coexists with a house number and leaves nothing unmatched', () => {
    const r = parseAddress({address: 'House 12, Chak 45/JB, Faisalabad'});
    expect(r.house).toBe('12');
    expect(r.chak).toBe('45/JB');
    expect(r.city).toBe('Faisalabad');
    expect(r.province).toBe('Punjab');
    expect(r.unmatched).toEqual([]);
  });

  it('does not invent an area when the chak is the locality', () => {
    const r = parseAddress({address: 'Chak No. 123/GB, Faisalabad'});
    expect(r.area).toBeNull();
    expect(r.unmatched).toEqual([]);
  });

  it('normalizeAddress emits the chak between unit and area', () => {
    expect(
      normalizeAddress({address: 'House 12, Chak 45/JB, Faisalabad'})
    ).toBe('House 12, Chak 45/JB, Faisalabad, Punjab, Pakistan');
    expect(normalizeAddress({address: 'Chak No. 123/GB, Faisalabad'})).toBe(
      'Chak 123/GB, Faisalabad, Punjab, Pakistan'
    );
  });

  it('leaves the real gazetteer names that collide untouched', () => {
    // Verified against src/data/areas.json — these are the only names carrying
    // both `chak` and a digit.
    for (const address of [
      'Chak 46 NB, Sargodha',
      'Chak 42 NB, Sargodha',
      'Dera Gardawar Chak 108/P, Rahim Yar Khan',
      'Basti Blochan Chak 55p., Rahim Yar Khan',
      'Chak number 108/p Rahimyar Khan',
    ]) {
      expect(parseAddress({address}).chak).toBeNull();
    }
  });

  it('leaves the spelled-out chak names untouched', () => {
    for (const address of [
      'Chak One Hundred Seventy/ M, Bahawalnagar',
      'Chak Seven Jhang Branch, Jhang',
      'Mehmand Chak, Gujrat',
    ]) {
      expect(parseAddress({address}).chak).toBeNull();
    }
  });

  it('never throws on a malformed chak', () => {
    for (const address of ['Chak /GB, Faisalabad', 'Chak abc', 'Chak']) {
      expect(() => parseAddress({address})).not.toThrow();
      expect(parseAddress({address}).chak).toBeNull();
    }
  });
});

describe('chak confidence', () => {
  it('scores a resolved chak like a gazetteer area', () => {
    // 0.35 province + 0.30 city + 0.15 chak-as-locality
    expect(
      parseAddress({address: 'Chak No. 123/GB, Faisalabad'}).confidence
    ).toBe(0.8);
    // + 0.05 house
    expect(
      parseAddress({address: 'House 12, Chak 45/JB, Faisalabad'}).confidence
    ).toBe(0.85);
  });

  it('does not double-count when an area also resolved', () => {
    const r = parseAddress({address: 'Chak 45/JB, Johar Town, Lahore'});
    expect(r.chak).toBe('45/JB');
    expect(r.area).toBe('Johar Town');
    // area already paid the 0.15; the chak must not add a second one.
    expect(r.confidence).toBeLessThanOrEqual(0.8);
  });
});
