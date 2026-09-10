import {describe, it, expect} from 'vitest';
import {normalizePunctuation} from '../src/normalize/punctuation.js';
import {expandAbbreviations} from '../src/normalize/abbreviations.js';
import {normalizeInput} from '../src/normalize/index.js';

describe('normalizePunctuation', () => {
  it('collapses whitespace and normalizes commas', () => {
    expect(normalizePunctuation('House  23 ,Street 4 ')).toBe(
      'House 23, Street 4'
    );
  });
  it('converts the Urdu comma to a normal comma', () => {
    expect(normalizePunctuation('Johar Town، Lahore')).toBe(
      'Johar Town, Lahore'
    );
  });
  it('turns newlines into segment breaks', () => {
    expect(normalizePunctuation('House 23\nJohar Town\nLahore')).toBe(
      'House 23, Johar Town, Lahore'
    );
  });
  it('collapses repeated commas and trims leading/trailing separators', () => {
    expect(normalizePunctuation(',House 23,, Lahore,')).toBe(
      'House 23, Lahore'
    );
  });
  it('replaces non-breaking spaces and en/em dashes', () => {
    expect(normalizePunctuation('F 7 — Islamabad')).toBe('F 7 - Islamabad');
  });
});

describe('expandAbbreviations', () => {
  const map = {st: 'street', ph: 'phase', khi: 'karachi', lhr: 'lahore'};
  it('expands whole tokens case-insensitively, preserving order', () => {
    expect(expandAbbreviations('St 4 Ph 2 KHI', map)).toBe(
      'street 4 phase 2 karachi'
    );
  });
  it('strips a single trailing dot before lookup', () => {
    expect(expandAbbreviations('St. 4', map)).toBe('street 4');
  });
  it('leaves unknown tokens and substrings untouched', () => {
    expect(expandAbbreviations('First Street', map)).toBe('First Street');
  });
});

describe('normalizeInput', () => {
  it('returns cleaned text and comma segments', () => {
    const r = normalizeInput('House 23, St 4, Block B, Johar Town, Lahore');
    expect(r.text).toBe('House 23, street 4, Block B, Johar Town, Lahore');
    expect(r.segments).toEqual([
      'House 23',
      'street 4',
      'Block B',
      'Johar Town',
      'Lahore',
    ]);
  });
  it('handles non-string input as empty', () => {
    // @ts-expect-error deliberate bad input
    expect(normalizeInput(undefined)).toEqual({text: '', segments: []});
  });
});
