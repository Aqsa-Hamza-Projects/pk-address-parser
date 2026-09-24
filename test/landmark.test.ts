import {describe, it, expect} from 'vitest';
import {extractLandmark} from '../src/parser/landmark.js';
import {parseAddress} from '../src/index.js';
import areas from '../src/data/areas.json' with {type: 'json'};

const names = (
  areas as {areas: Array<{name: string; aliases?: string[]}>}
).areas.flatMap((a) => [a.name, ...(a.aliases ?? [])]);

describe('extractLandmark', () => {
  it("detects 'near' and title-cases the preposition", () => {
    expect(extractLandmark('near Emporium Mall').landmark).toBe(
      'Near Emporium Mall'
    );
  });
  it('keeps the original casing of the landmark name', () => {
    expect(extractLandmark('Near emporium mall').landmark).toBe(
      'Near emporium mall'
    );
  });
  it("expands 'opp' / 'opp.' to 'Opposite'", () => {
    expect(extractLandmark('opp. Chase Up').landmark).toBe('Opposite Chase Up');
    expect(extractLandmark('opp Chase Up').landmark).toBe('Opposite Chase Up');
  });
  it('handles multi-word prepositions', () => {
    expect(extractLandmark('in front of PSO pump').landmark).toBe(
      'In Front Of PSO pump'
    );
  });
  it('returns null when there is no landmark preposition', () => {
    expect(extractLandmark('Johar Town').landmark).toBeNull();
    // 'near' must not prefix-match into a longer word.
    expect(extractLandmark('nearest pump').landmark).toBeNull();
  });
});

describe('Roman-Urdu landmark prepositions', () => {
  it.each([
    ['k paas masjid', 'Near masjid'],
    ['ke paas masjid', 'Near masjid'],
    ['qareeb chungi amar sidhu', 'Near chungi amar sidhu'],
    ['nazdeek general hospital', 'Near general hospital'],
    ['k samne park', 'Opposite park'],
    ['ke peechay school', 'Behind school'],
    ['next to shell pump', 'Adjacent To shell pump'],
  ])('%s → %s', (segment, landmark) => {
    expect(extractLandmark(segment).landmark).toBe(landmark);
  });

  it('prefers the longest preposition — "near by" is not "near" + "by"', () => {
    expect(extractLandmark('near by masjid').landmark).toBe('Near masjid');
  });

  it('does not match a bare saath, which is a noun on its own', () => {
    expect(extractLandmark('saath colony').landmark).toBeNull();
  });

  it('threads a Roman-Urdu landmark through parseAddress', () => {
    const r = parseAddress({
      address: 'Plot 33, k paas masjid, Johar Town, Lahore',
    });
    expect(r.house).toBe('33');
    expect(r.landmark).toBe('Near masjid');
    expect(r.area).toBe('Johar Town');
    expect(r.city).toBe('Lahore');
  });

  it.each([
    ['Jamia Masjid ke paas', 'Near Jamia Masjid'],
    ['masjid k pass', 'Near masjid'],
    ['General Hospital ke qareeb', 'Near General Hospital'],
    ['school ke nazdeek', 'Near school'],
    ['Emporium Mall k samne', 'Opposite Emporium Mall'],
    ['park ke saamne', 'Opposite park'],
    ['school ke peechay', 'Behind school'],
    ['Shell Pump ke saath', 'Adjacent To Shell Pump'],
    ['Chungi No 1 ke paas', 'Near Chungi No 1'],
    ['Masjid ke paas.', 'Near Masjid'],
  ])('postposition order: %s → %s', (segment, landmark) => {
    expect(extractLandmark(segment).landmark).toBe(landmark);
  });

  it('prefers the prefix form when a segment starts with one', () => {
    expect(extractLandmark('k paas masjid').landmark).toBe('Near masjid');
  });

  it('does not take a segment carrying house or street as a landmark', () => {
    expect(
      extractLandmark('house 5 gali 3 johar town lahore masjid ke paas')
        .landmark
    ).toBeNull();
  });

  it('matches no gazetteer name', () => {
    const hits = names.filter((n) => extractLandmark(n).landmark !== null);
    const postHits = hits.filter((n) => /\s(?:k|ke)\s+\S+\.?$/i.test(n));
    expect(postHits).toEqual([]);
  });

  it('threads a postposition landmark through parseAddress', () => {
    const r = parseAddress({
      address: 'House 5, Jamia Masjid ke paas, Johar Town, Lahore',
    });
    expect(r.house).toBe('5');
    expect(r.landmark).toBe('Near Jamia Masjid');
    expect(r.area).toBe('Johar Town');
    expect(r.unmatched).toEqual([]);
  });

  it('keeps house and street in a comma-less address ending in one', () => {
    const r = parseAddress({
      address: 'house 5 gali 3 johar town lahore masjid ke paas',
    });
    expect(r.house).toBe('5');
    expect(r.street).toBe('3');
    expect(r.area).toBe('Johar Town');
  });

  it('still handles the English prepositions', () => {
    expect(extractLandmark('opposite pso pump').landmark).toBe(
      'Opposite pso pump'
    );
    expect(extractLandmark('in front of the bank').landmark).toBe(
      'In Front Of the bank'
    );
  });
});
