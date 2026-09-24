import abbreviations from '../data/abbreviations.json' with {type: 'json'};
import type {NormalizedInput} from '../interfaces/index.js';
import {normalizePunctuation} from './punctuation.js';
import {expandAbbreviations} from './abbreviations.js';

/** Split normalized text into comma-delimited segments, dropping empties. */
export function segment(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function normalizeInput(raw: string): NormalizedInput {
  if (typeof raw !== 'string' || raw.trim() === '') {
    return {text: '', segments: []};
  }
  const cleaned = normalizePunctuation(raw);
  const text = expandAbbreviations(
    cleaned,
    abbreviations as Record<string, string>
  );
  return {text, segments: segment(text)};
}
