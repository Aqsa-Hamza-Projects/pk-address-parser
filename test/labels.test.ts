import {describe, it, expect} from 'vitest';
import {
  HOUSE_LABELS,
  STREET_LABELS,
  NUMBER_WORDS,
  LOCALITY_LABELS,
  stripLocalityLabels,
} from '../src/parser/labels.js';

describe('vocabulary', () => {
  it('carries the Roman-Urdu house labels alongside the English ones', () => {
    for (const w of ['house', 'kothi', 'plot', 'makan', 'ghar', 'bangla']) {
      expect(HOUSE_LABELS).toContain(w);
    }
  });

  it('carries the Roman-Urdu street labels', () => {
    for (const w of ['street', 'st', 'gali', 'galli', 'koocha', 'lane']) {
      expect(STREET_LABELS).toContain(w);
    }
  });

  it('carries the number words', () => {
    for (const w of ['no', 'num', 'nmbr', 'number']) {
      expect(NUMBER_WORDS).toContain(w);
    }
  });

  it('does not treat chowk as a droppable locality label', () => {
    // "Pakistan Chowk" is a name, not a labelled locality — chowk is a
    // suffix, so dropping it destroys the name rather than a label.
    expect(LOCALITY_LABELS).not.toContain('chowk');
  });
});

describe('stripLocalityLabels', () => {
  it('drops a bare label once the gazetteer resolved the area', () => {
    expect(stripLocalityLabels(['mohalla'], true)).toEqual([]);
  });

  it('keeps the label when no area resolved — it is part of the name', () => {
    expect(stripLocalityLabels(['goth', 'allah', 'dino'], false)).toEqual([
      'goth',
      'allah',
      'dino',
    ]);
  });

  it('keeps everything when other content remains beside the label', () => {
    expect(stripLocalityLabels(['goth', 'ahmed'], true)).toEqual([
      'goth',
      'ahmed',
    ]);
  });

  it('drops several labels when they are the whole remainder', () => {
    expect(stripLocalityLabels(['mohalla', 'basti'], true)).toEqual([]);
  });

  it('is case-insensitive', () => {
    expect(stripLocalityLabels(['Mohalla'], true)).toEqual([]);
  });

  it('returns an empty array unchanged', () => {
    expect(stripLocalityLabels([], true)).toEqual([]);
  });
});
