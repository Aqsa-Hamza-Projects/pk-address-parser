import {describe, it, expect} from 'vitest';
import areas from '../src/data/areas.json' with {type: 'json'};
import {parseAddress} from '../src/index.js';
import {
  HOUSE_RE,
  STREET_RE,
  HOUSE_URDU_RE,
  STREET_URDU_RE,
} from '../src/parser/labels.js';

interface AreaRow {
  name: string;
  city: string;
  province: string;
  aliases?: string[];
}
const rows = (areas as {areas: AreaRow[]}).areas;
const names = rows.flatMap((a) => [a.name, ...(a.aliases ?? [])]);

// The rules under test are imported from the module `components.ts` uses, not
// rebuilt here — a hand-copied regex pins a parallel copy, not the production
// rule, and the two diverge the moment someone edits one of them.
const URDU_RULES: Array<[string, RegExp]> = [
  ['house (Roman Urdu)', HOUSE_URDU_RE],
  ['street (Roman Urdu)', STREET_URDU_RE],
];
const ALL_RULES: Array<[string, RegExp]> = [
  ['house (English)', HOUSE_RE],
  ['street (English)', STREET_RE],
  ...URDU_RULES,
];

describe('label rules vs the gazetteer', () => {
  it('has a corpus worth testing', () => {
    expect(names.length).toBeGreaterThan(4000);
  });

  // ~370 locality names contain a label word (`Sund Gali`, `Makan Bagh`,
  // `Ghanta Ghar`, 188 `Goth …`). A bare name must never look like a label.
  it.each(ALL_RULES)('%s matches no bare locality name', (_label, re) => {
    expect(names.filter((n) => re.test(n))).toEqual([]);
  });

  // The case the first cut of this test missed. No name in `areas.json` ends
  // in a digit, so testing bare names alone could never catch a rule firing on
  // `<locality> <house number>` — which is an entirely ordinary thing to write
  // and is exactly how `Sund Gali 5` became `area: 'Sund', street: '5'`.
  it.each(URDU_RULES)(
    '%s matches no locality name followed by a number',
    (_label, re) => {
      const casualties = names.filter((n) => re.test(`${n} 5`));
      expect(casualties).toEqual([]);
    }
  );

  // …and the guard is not vacuous: without the leading-word guard, the same
  // corpus produces real casualties. If this ever returns nothing, the guard
  // has stopped doing anything and the test above is no longer proving it.
  it('the leading-word guard is what makes the number case safe', () => {
    const unguarded = new RegExp(
      STREET_URDU_RE.source.replace(/^\(\?<!.*?\)/, ''),
      'iu'
    );
    const casualties = names.filter((n) => unguarded.test(`${n} 5`));
    expect(casualties).toContain('Sund Gali');
    expect(casualties).toContain('Qasim Lane');
  });
});

describe('localities whose names contain a label word still resolve', () => {
  const cases: Array<[string, string, string]> = [
    ['Ghanta Ghar, Multan', 'Ghanta Ghar', 'Multan'],
    ['Sund Gali, Muzaffarabad', 'Sund Gali', 'Muzaffarābād'],
    ['Latifabad Number Ten, Hyderabad', 'Latifabad Number Ten', 'Hyderabad'],
    ['Basti Islamabad, Multan', 'Basti Islamabad', 'Multan'],
    ['Makan Bagh, Swat', 'Makan Bagh', 'Swat'],
    ['Qasim Lane, Karachi', 'Qasim Lane', 'Karachi'],
    ['Pakistan Chowk, Karachi', 'Pakistan Chowk', 'Karachi'],
    [
      'Korangi Colony Number Five, Karachi',
      'Korangi Colony Number Five',
      'Karachi',
    ],
  ];

  it.each(cases)('%s → %s', (address, area, city) => {
    const r = parseAddress({address});
    expect(r.area).toBe(area);
    expect(r.city).toBe(city);
    expect(r.unmatched).toEqual([]);
  });

  // The regression found in review: a house number after the locality must not
  // eat the tail of the name. `main` leaves the number in `unmatched`; that is
  // the behaviour to preserve, since parsing it properly is a separate change.
  it.each([
    ['Sund Gali 5, Muzaffarabad', 'Sund Gali'],
    ['Ghanta Ghar 5, Multan', 'Ghanta Ghar'],
    ['Qasim Lane 5, Karachi', 'Qasim Lane'],
    ['Makan Bagh 12, Swat', 'Makan Bagh'],
  ])('%s keeps the full locality name', (address, area) => {
    const r = parseAddress({address});
    expect(r.area).toBe(area);
  });

  // `Goth Juma Khan Narejo` does not resolve exactly on `main` either — the
  // gazetteer picks `Jumma Goth`. Pinned as-is so this PR is proven not to
  // make it worse; improving it belongs to the fuzzy-matching PR (PR-A8).
  it('does not regress Goth Juma Khan Narejo', () => {
    const r = parseAddress({address: 'Goth Juma Khan Narejo, Dadu'});
    expect(r.area).toBe('Jumma Goth');
    expect(r.city).toBe('Dadu');
    expect(r.unmatched).toEqual(['Khan', 'Narejo']);
  });

  // The one gazetteer name that is exactly a bare locality label. It resolves
  // as the area, so `stripLocalityLabels` never sees it.
  it('keeps the locality that is itself a bare label', () => {
    expect(parseAddress({address: 'Mahalla, Sialkot'}).area).toBe('Mahalla');
  });
});
