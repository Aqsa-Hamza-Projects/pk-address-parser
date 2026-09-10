import {describe, it, expect} from 'vitest';
import {normalizeAddress} from '../src/index.js';

describe('normalizeAddress', () => {
  it('expands a sparse input to canonical order', () => {
    expect(normalizeAddress({address: 'lahore johar town'})).toBe(
      'Johar Town, Lahore, Punjab, Pakistan'
    );
  });
  it('keeps and labels components', () => {
    expect(
      normalizeAddress({
        address: 'House 23, Street 4, Block B, Johar Town, Lahore',
      })
    ).toBe('House 23, Street 4, Block B, Johar Town, Lahore, Punjab, Pakistan');
  });
  it('collapses city into an ICT-style province', () => {
    expect(normalizeAddress({address: 'h#7 st 12 f-8/3 islamabad'})).toBe(
      'House 7, Street 12, Sector F-8/3, Islamabad Capital Territory, Pakistan'
    );
  });
  it('falls back to a cleaned copy when nothing resolves', () => {
    expect(normalizeAddress({address: '  qwerty   asdf  '})).toBe(
      'qwerty asdf'
    );
  });
  it('bad input → empty string, no throw', () => {
    // @ts-expect-error deliberate bad input
    expect(normalizeAddress()).toBe('');
    // @ts-expect-error deliberate bad input
    expect(normalizeAddress({address: null})).toBe('');
  });
});
