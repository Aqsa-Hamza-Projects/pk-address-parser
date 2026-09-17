import {describe, it, expect} from 'vitest';
import {parseAddress} from '../src/index.js';
import {
  SUBUNIT_LABELS,
  GUARD_ONLY_SUBUNIT_LABELS,
} from '../src/parser/subunit-labels.js';

describe('unit label rule', () => {
  it('captures Hyderabad-style "Unit N" with the label preserved', () => {
    const r = parseAddress({address: 'Latifabad Unit 7, Hyderabad'});
    expect(r.unit).toBe('Unit 7');
    expect(r.unmatched).toEqual([]);
  });

  it('captures "Unit No. 9" and a segment-initial unit', () => {
    expect(
      parseAddress({address: 'Unit No. 9, Latifabad, Hyderabad'}).unit
    ).toBe('Unit No. 9');
    expect(parseAddress({address: 'Unit 9, Latifabad, Hyderabad'}).unit).toBe(
      'Unit 9'
    );
  });

  it('leaves the spelled-out gazetteer names alone', () => {
    // Real records: "Latifabad Unit Number Four", "Unit Number Two",
    // "One Unit Colony". None has `unit` followed by a digit.
    for (const address of [
      'Latifabad Unit Number Four, Hyderabad',
      'Unit Number Two, Hyderabad',
      'One Unit Colony, Sargodha',
    ]) {
      expect(parseAddress({address}).unit).toBeNull();
    }
  });

  it('keeps the area guard vocabulary unchanged by the move', () => {
    // `unit` must be in exactly one of the two lists, and the union — which is
    // what assemble.ts builds its guard from — must still contain it.
    const union = [...SUBUNIT_LABELS, ...GUARD_ONLY_SUBUNIT_LABELS];
    expect(union).toContain('unit');
    expect(SUBUNIT_LABELS).toContain('unit');
    expect(GUARD_ONLY_SUBUNIT_LABELS).not.toContain('unit');
    expect(new Set(union).size).toBe(union.length);
  });
});
