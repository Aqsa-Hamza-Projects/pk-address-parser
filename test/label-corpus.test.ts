import {describe, it, expect} from 'vitest';
import areas from '../src/data/areas.json' with {type: 'json'};
import {parseAddress} from '../src/index.js';
import {
  HOUSE_LABELS,
  STREET_LABELS,
  NUMBER_WORDS,
} from '../src/parser/labels.js';

interface AreaRow {
  name: string;
  city: string;
  province: string;
  aliases?: string[];
}
const rows = (areas as {areas: AreaRow[]}).areas;
const names = rows.flatMap((a) => [a.name, ...(a.aliases ?? [])]);

const NUM = NUMBER_WORDS.join('|');
const HOUSE_RE = new RegExp(
  `\\b(?:${HOUSE_LABELS.join('|')})\\b\\s*(?:\\.?\\s*(?:${NUM})\\.?)?\\s*[:#.-]?\\s*([0-9]+[a-z]?(?:[/-][0-9a-z]+)*)`,
  'i'
);
const STREET_RE = new RegExp(
  `\\b(?:${STREET_LABELS.join('|')})\\b\\.?\\s*(?:(?:${NUM})\\.?\\s*)?[:#.-]?\\s*([0-9]+[a-z]?(?:-[0-9a-z]+)?)`,
  'i'
);

describe('label rules vs the gazetteer', () => {
  it('has a corpus worth testing', () => {
    expect(names.length).toBeGreaterThan(4000);
  });

  // ~370 locality names contain a label word (`Sund Gali`, `Makan Bagh`,
  // `Ghanta Ghar`, 188 `Goth …`). The digit anchor is what separates a label
  // from a name; without it these rules would shred the gazetteer.
  it('matches no real locality name with the house rule', () => {
    expect(names.filter((n) => HOUSE_RE.test(n))).toEqual([]);
  });

  it('matches no real locality name with the street rule', () => {
    expect(names.filter((n) => STREET_RE.test(n))).toEqual([]);
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
