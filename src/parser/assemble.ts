import {emptyResult} from '../result.js';
import {COUNTRY} from '../constants.js';
import type {ParsedAddress, AssembleInput} from '../interfaces/index.js';
import type {ComponentField} from '../types/index.js';
import {stripLocalityLabels} from './labels.js';

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
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

  // A bare `mohalla`/`goth`/`basti` left over once the gazetteer has already
  // named the area is noise, not a locality. Stripped here rather than during
  // normalization because `Mohalla Qasimabad` is itself a real area — the
  // label may only be discarded after the gazetteer has had its look.
  let leftover = stripLocalityLabels(
    input.geo.leftover,
    input.geo.area !== null
  );
  let areaFromFallback = false;
  if (
    input.geo.area == null &&
    !input.strict &&
    leftover.length > 0 &&
    (r.city !== null || r.province !== null)
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
