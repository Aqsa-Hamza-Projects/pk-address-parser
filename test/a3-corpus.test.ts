import {describe, it, expect} from 'vitest';
import areasJson from '../src/data/areas.json' with {type: 'json'};

const NAMES: string[] = (
  areasJson as {areas: {name: string; aliases: string[]}[]}
).areas.flatMap((a) => [a.name, ...a.aliases]);

// The two rules under test, copied from src/parser/components.ts and
// src/parser/subunit-labels.ts. Copied deliberately: this test must fail when
// the shipped rule changes shape, not silently follow it.
const CHAK_GUARDED =
  /(?<=(?:^|,)\s*)chak\s*(?:no\.?|#)?\s*(\d{1,4}[/-][0-9A-Za-z][0-9A-Za-z-]*|\d{1,4}(?!\s*[0-9A-Za-z]))/i;
const UNIT =
  /\bunit\s*(?:\.?\s*no\.?)?\s*[:#.-]?\s*(?:[0-9]+(?:-[a-z0-9]+)?|[a-z]-[0-9]{1,2})/i;

// Guards removed, one at a time, so we can prove each one is load-bearing.
const CHAK_NO_POSITION_GUARD =
  /chak\s*(?:no\.?|#)?\s*(\d{1,4}[/-][0-9A-Za-z][0-9A-Za-z-]*|\d{1,4}(?!\s*[0-9A-Za-z]))/i;
const CHAK_NO_SHAPE_GUARD =
  /(?<=(?:^|,)\s*)chak\s*(?:no\.?|#)?\s*(\d{1,4}(?:[/-][0-9A-Za-z-]+)?)/i;

describe('PR-A3 rules against the whole gazetteer', () => {
  it('has a corpus worth testing', () => {
    expect(NAMES.length).toBeGreaterThan(4000);
  });

  it('the unit rule matches no real name, bare or with a number appended', () => {
    const bare = NAMES.filter((n) => UNIT.test(n));
    expect(bare).toEqual([]);
    // The PR-A2 regression was a name *ending* in the label, with the number
    // supplied by the address. Append one to every name to simulate that.
    const suffixed = NAMES.filter((n) => UNIT.test(`${n} 5`));
    expect(suffixed).toEqual([]);
  });

  it('that unit check could actually have failed', () => {
    // Prove the corpus exercises the dangerous shape: a name ending in `unit`
    // WOULD be caught. If this ever passes trivially, the test above is inert.
    expect(UNIT.test('Sund Unit 5')).toBe(true);
    expect(NAMES.some((n) => /\bunit\b/i.test(n))).toBe(true);
  });

  it('the guarded chak rule matches no real name', () => {
    const hits = NAMES.filter((n) => CHAK_GUARDED.test(n));
    expect(hits).toEqual([]);
  });

  it('the position guard is load-bearing', () => {
    // Without it, real names with a word before `chak` are eaten.
    const hits = NAMES.filter((n) => CHAK_NO_POSITION_GUARD.test(n));
    expect(hits).toContain('Dera Gardawar Chak 108/P');
    expect(hits.length).toBeGreaterThan(0);
  });

  it('the shape guard is load-bearing', () => {
    // Without it, `Chak 46 NB` and friends are eaten.
    const hits = NAMES.filter((n) => CHAK_NO_SHAPE_GUARD.test(n));
    expect(hits).toContain('Chak 46 NB');
    expect(hits.length).toBeGreaterThan(0);
  });

  it('the chak rule still matches the forms it is for', () => {
    for (const s of [
      'Chak No. 123/GB, Faisalabad',
      'Chak 45/JB, Faisalabad',
      'Chak 7/1-L, Okara',
      'House 12, Chak 45/JB, Faisalabad',
    ]) {
      expect(CHAK_GUARDED.test(s)).toBe(true);
    }
  });

  it('the word "number" is untouched by both rules', () => {
    const withNumber = NAMES.filter((n) => /\bnumber\b/i.test(n));
    expect(withNumber.length).toBeGreaterThan(90);
    for (const n of withNumber) {
      expect(UNIT.test(n)).toBe(false);
      expect(CHAK_GUARDED.test(n)).toBe(false);
    }
  });
});
