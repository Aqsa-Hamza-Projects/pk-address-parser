import {describe, it, expect} from 'vitest';
import {parseAddress} from '../src/index.js';

describe('plain Latifabad', () => {
  it('resolves to Latifabad, not to Unit 10', () => {
    const r = parseAddress({address: 'Latifabad, Hyderabad'});
    expect(r.area).toBe('Latifabad');
    expect(r.city).toBe('Hyderabad');
    expect(r.province).toBe('Sindh');
    expect(r.confidence).toBe(0.8);
  });

  it('the acceptance case resolves end to end', () => {
    const r = parseAddress({address: 'Latifabad Unit 7, Hyderabad'});
    expect(r.unit).toBe('Unit 7');
    expect(r.area).toBe('Latifabad');
    expect(r.city).toBe('Hyderabad');
    expect(r.unmatched).toEqual([]);
    expect(r.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('does NOT disturb any numbered variant', () => {
    // The word `number` is load-bearing in 96 real names and is not touched.
    const cases: [string, string][] = [
      ['Latifabad Number Ten, Hyderabad', 'Latifabad Number Ten'],
      ['Latifabad Number Seven, Hyderabad', 'Latifabad Number Seven'],
      ['Latifabad Number Four, Hyderabad', 'Latifabad Number Four'],
      ['Unit Number Two, Hyderabad', 'Latifabad Unit Number Two'],
      ['Latifabad Unit Number Nine, Hyderabad', 'Latifabad Number Nine'],
    ];
    for (const [address, expected] of cases) {
      expect(parseAddress({address}).area).toBe(expected);
    }
  });
});
