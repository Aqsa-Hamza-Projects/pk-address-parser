import {emptyResult} from '../result.js';
import {COUNTRY} from '../constants.js';
import type {ParsedAddress, AssembleInput} from '../interfaces/index.js';
import type {ComponentField} from '../types/index.js';
import {SUBUNIT_LABELS, GUARD_ONLY_SUBUNIT_LABELS} from './subunit-labels.js';

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

const ORDINAL_SRC = '\\d+(?:st|nd|rd|th)';
const ORDINAL = new RegExp(`^${ORDINAL_SRC}$`, 'i');

// "2nd Floor", "Ground Floor", "Top Fl", "Floor 2", "Basement" — a storey, not
// a locality. The component rules already own one of these per address; a
// second one must not fall through to `area`.
const FLOOR = new RegExp(
  `^(?:(?:${ORDINAL_SRC}|ground|grnd|first|second|third|fourth|fifth|top|upper|lower|mezzanine)?\\s*(?:floor|fl)|floor\\s*(?:no\\.?)?\\s*\\d+|basement)$`,
  'i'
);

// "Unit 4", "Flat 12-B", "Shop No. 7" — a sub-unit, not a locality. Built from
// the same vocabulary as the `unit` component rule so the two cannot drift.
const SUBUNIT = new RegExp(
  `^(?:${[...SUBUNIT_LABELS, ...GUARD_ONLY_SUBUNIT_LABELS].join('|')})\\b[\\s.:#-]*(?:no\\.?)?[\\s.:#-]*\\d+\\s*[a-z]?$`,
  'i'
);

// A leftover that is a numbered chak — `Chak 6`, `Chak 12345/GB`, and with the
// filler word an `and`-joined second chak leaves behind. Requires a digit, so
// real spelled-out names (`Chak Seven Jhang Branch`) are untouched.
const CHAK_LEFTOVER = /^(?:and\s+)?chak\b[\s.:#-]*(?:no\.?)?[\s.:#-]*\d/i;

/**
 * Is a leftover run plausibly a locality name?
 *
 * The fallback below promotes leftovers to `area` when the gazetteer found
 * nothing. Without this check a pasted phone number, a floor descriptor or a
 * stray number becomes the locality a delivery app routes on.
 */
function looksLikeArea(tokens: string[]): boolean {
  const joined = tokens.join(' ').trim();
  if (joined === '') return false;
  // No letters in any script — a number, not a place. `\p{L}` rather than
  // `[a-z]`, so an Urdu-script locality is still kept.
  if (!/\p{L}/u.test(joined)) return false;
  // Every token is a number or a bare ordinal.
  if (tokens.every((t) => /^\d+$/.test(t) || ORDINAL.test(t))) return false;
  // Still carries a long digit run — a phone or reference number we failed to
  // recognize, with a word stuck to it. Separators are dropped first so
  // "042-111-123-456" reads as one run.
  if (/\d{6,}/.test(joined.replace(/[\s.()-]/g, ''))) return false;
  if (FLOOR.test(joined)) return false;
  if (SUBUNIT.test(joined)) return false;
  // A numbered chak is a locality the `chak` rule owns, not a name to invent.
  // Only one chak is captured per address, so a second one (`Chak 5, Chak 6`)
  // or one the rule declined (`Chak 12345/GB`, over the 4-digit cap) reaches
  // here — and must go to `unmatched` rather than become a fabricated `area`.
  // Spelled-out chaks (`Chak Seven Jhang Branch`) are real gazetteer names and
  // are deliberately still allowed through.
  if (CHAK_LEFTOVER.test(joined)) return false;
  return true;
}

function setComponent(
  result: ParsedAddress,
  field: ComponentField,
  value: string
): void {
  result[field] = value;
}

/**
 * Credit for the single best locality signal in the result.
 *
 * At most one locality signal scores. A gazetteer-resolved `area` and a `chak`
 * are both locality evidence worth the same; a guessed (non-gazetteer) area is
 * not evidence at all and costs a penalty so `confidence` still flags the
 * address for review.
 *
 * Ordered, not additive: a chak outranks a *guessed* area, because a fabricated
 * locality must never suppress the credit for a self-validating one. Before
 * this was ordered, `Chak 5, Chak 6, Faisalabad` scored 0.55 — lower than the
 * bare `Chak 5, Faisalabad` at 0.80 — despite carrying strictly more evidence.
 */
function localityScore(r: ParsedAddress, areaFromFallback: boolean): number {
  if (r.area && !areaFromFallback) return 0.15; // gazetteer area
  if (r.chak) return 0.15; // self-validating rural locality
  if (r.area && areaFromFallback) return -0.1; // guessed, not evidence
  return 0;
}

export function computeConfidence(
  r: ParsedAddress,
  areaFromFallback = false
): number {
  let score = 0;
  if (r.province) score += 0.35;
  if (r.city) score += 0.3;
  score += localityScore(r, areaFromFallback);
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
