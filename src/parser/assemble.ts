import {emptyResult} from '../result.js';
import {COUNTRY} from '../constants.js';
import type {ParsedAddress, AssembleInput} from '../interfaces/index.js';
import type {ComponentField} from '../types/index.js';

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

const ORDINAL = /^\d+(?:st|nd|rd|th)$/i;

/**
 * Is a leftover run plausibly a locality name?
 *
 * The fallback below promotes leftovers to `area` when the gazetteer found
 * nothing. Without this check a pasted phone number, a floor descriptor or a
 * stray number becomes the locality a delivery app routes on. Patterns are
 * anchored to the WHOLE leftover, so `Unit 7 Latifabad` still reads as an area.
 */
function looksLikeArea(tokens: string[]): boolean {
  const joined = tokens.join(' ').trim();
  if (joined === '') return false;
  // No letters at all — a number, not a place.
  if (!/[a-z]/i.test(joined)) return false;
  // Every token is a number or a bare ordinal.
  if (tokens.every((t) => /^\d+$/.test(t) || ORDINAL.test(t))) return false;
  // A floor or unit descriptor a component rule already consumed once.
  if (/^\d+(?:st|nd|rd|th)\s+floor$/i.test(joined)) return false;
  if (/^unit\s*(?:no\.?)?\s*\d+$/i.test(joined)) return false;
  return true;
}

function setComponent(
  result: ParsedAddress,
  field: ComponentField,
  value: string
): void {
  result[field] = value;
}

export function computeConfidence(
  r: ParsedAddress,
  areaFromFallback = false
): number {
  let score = 0;
  if (r.province) score += 0.35;
  if (r.city) score += 0.3;
  if (r.area && !areaFromFallback) score += 0.15;
  // A guessed (non-gazetteer) area is not evidence — no credit, plus a penalty
  // so `confidence` still flags the address for review.
  if (r.area && areaFromFallback) score -= 0.1;
  let comp = 0;
  for (const f of ['house', 'street', 'block', 'sector', 'phase'] as const) {
    if (r[f]) comp += 0.05;
  }
  score += Math.min(comp, 0.2);
  score -= (0.15 * Math.min(r.unmatched.length, 3)) / 3;
  score = Math.max(0, Math.min(1, score));
  return Math.round(score * 100) / 100;
}

export function assemble(input: AssembleInput): ParsedAddress {
  const r = emptyResult(input.raw);
  for (const m of input.components) setComponent(r, m.field, m.value);
  r.landmark = input.landmark;
  r.city = input.geo.city;
  r.province = input.geo.province;
  r.country = COUNTRY;
  r.phone = input.phone;

  let leftover = input.geo.leftover;
  let areaFromFallback = false;
  if (
    input.geo.area == null &&
    !input.strict &&
    leftover.length > 0 &&
    (r.city !== null || r.province !== null) &&
    looksLikeArea(leftover)
  ) {
    r.area = titleCase(leftover.join(' '));
    leftover = [];
    areaFromFallback = true;
  } else {
    r.area = input.geo.area;
  }
  r.unmatched = leftover;
  r.confidence = computeConfidence(r, areaFromFallback);
  return r;
}
