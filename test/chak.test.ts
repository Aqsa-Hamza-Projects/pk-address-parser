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
      // The hyphen spelling of the same real names is equally ordinary and was
      // eaten by the first cut of this rule (review finding).
      'Chak 46-NB, Sargodha',
      'Chak 42-NB, Sargodha',
      'Dera Gardawar Chak 108/P, Rahim Yar Khan',
      'Basti Blochan Chak 55p., Rahim Yar Khan',
      'Chak number 108/p Rahimyar Khan',
    ]) {
      expect(parseAddress({address}).chak).toBeNull();
    }
    // …and still resolve as the gazetteer areas they are.
    expect(parseAddress({address: 'Chak 46-NB, Sargodha'}).area).toBe(
      'Chak Forty-six Shumali'
    );
  });

  it('fires without commas, the common rural spelling', () => {
    // The segment-start guard is defeated by a preceding house/plot token when
    // the address has no commas. The rule runs after those rules have blanked
    // their spans, so the prefix is whitespace by the time it is applied.
    for (const address of [
      'House 12 Chak 45/JB Faisalabad',
      'H#12 Chak 45/JB, Faisalabad',
      'Chak No 45/JB Faisalabad',
    ]) {
      expect(parseAddress({address}).chak).toBe('45/JB');
    }
    // A genuine locality prefix must still block it.
    expect(
      parseAddress({address: 'Village Chak 45/JB, Faisalabad'}).chak
    ).toBeNull();
  });

  it('does not fabricate an area from a chak it declined', () => {
    // Only one chak is captured per address; the rest must reach `unmatched`
    // rather than be invented as a locality by the area fallback.
    const second = parseAddress({address: 'Chak 5, Chak 6, Faisalabad'});
    expect(second.chak).toBe('5');
    expect(second.area).toBeNull();
    expect(second.unmatched).toEqual(['Chak', '6']);

    // Over the 4-digit cap — declined, and still not fabricated.
    const over = parseAddress({address: 'Chak 12345/GB, Faisalabad'});
    expect(over.chak).toBeNull();
    expect(over.area).toBeNull();

    // A spelled-out chak IS a real gazetteer name and must still resolve.
    expect(parseAddress({address: 'Chak Seven Jhang Branch, Jhang'}).area).toBe(
      'Chak Seven Jhang Branch'
    );
  });

  it('is not extracted from a landmark segment (known limitation)', () => {
    // Landmark segments are removed before `extractComponents` runs, so a chak
    // inside one is kept as part of the landmark rather than extracted.
    // Documented in the README; pinned here so a future change is deliberate.
    const r = parseAddress({address: 'Near Chak No. 123/GB, Faisalabad'});
    expect(r.chak).toBeNull();
    expect(r.landmark).toBe('Near Chak No. 123/GB');
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

  it('does not double-count when a gazetteer area also resolved', () => {
    const r = parseAddress({address: 'Chak 45/JB, Johar Town, Lahore'});
    expect(r.chak).toBe('45/JB');
    expect(r.area).toBe('Johar Town');
    // area already paid the 0.15; the chak must not add a second one.
    // Exact, not a bound — a bound would still pass if the clause vanished.
    expect(r.confidence).toBe(0.8);
  });

  it('a guessed area does not suppress the chak credit', () => {
    // `Zzqq Mohalla` is not in the gazetteer, so it is a *fabricated* area.
    // A fabrication must never outrank the self-validating chak: before the
    // locality signals were ordered, this scored 0.55 — worse than the bare
    // `Chak 45/JB, Faisalabad` at 0.80, despite carrying more information.
    const guessed = parseAddress({
      address: 'Chak 45/JB Zzqq Mohalla, Faisalabad',
    });
    expect(guessed.chak).toBe('45/JB');
    expect(guessed.area).toBe('Zzqq Mohalla');
    expect(guessed.confidence).toBe(0.8);
    expect(guessed.confidence).toBeGreaterThanOrEqual(
      parseAddress({address: 'Chak 45/JB, Faisalabad'}).confidence
    );
  });
});
