import type {ComponentField} from '../types/index.js';
import type {
  ComponentMatch,
  ComponentResult,
  ComponentRule,
} from '../interfaces/index.js';
import {SUBUNIT_LABELS} from './subunit-labels.js';

const ROMAN: Record<string, string> = {
  i: '1',
  ii: '2',
  iii: '3',
  iv: '4',
  v: '5',
  vi: '6',
  vii: '7',
  viii: '8',
  ix: '9',
  x: '10',
  xi: '11',
  xii: '12',
};

function romanOrDigit(raw: string): string {
  const key = raw.toLowerCase();
  return ROMAN[key] ?? raw;
}

// `unit` keeps its label: title-case the leading label word, preserve the value.
function unitLabel(raw: string): string {
  const s = raw.trim().replace(/\s+/g, ' ');
  const sp = s.indexOf(' ');
  if (sp < 0) return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  const head = s.slice(0, sp);
  return (
    head.charAt(0).toUpperCase() + head.slice(1).toLowerCase() + s.slice(sp)
  );
}

function floorLabel(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/(\d+(?:st|nd|rd|th))\s+floor/, '$1 Floor');
}

// Order matters: labeled sector before block; bare sector after block/unit;
// house label before bare '#'.
const RULES: ComponentRule[] = [
  {
    field: 'house',
    re: /\b(?:house|hno|kothi|plot|h)\b\s*(?:\.?\s*no\.?)?\s*[:#.-]?\s*([0-9]+[a-z]?(?:[/-][0-9a-z]+)*)/i,
  },
  // The bare `#` house rule must not claim `Chak # 66/5-L` — the chak rule
  // runs last (see its comment), so without this guard `#` would take the
  // canal-branch value as a house number before chak ever sees it.
  {
    field: 'house',
    re: /(?:^|[(,\s])(?<!chak\s)#\s*([0-9]+[a-z]?(?:[/-][0-9a-z]+)*)/i,
  },
  {
    field: 'street',
    re: /\b(?:street|st)\b\.?\s*(?:no\.?\s*)?[:#.-]?\s*([0-9]+[a-z]?(?:-[0-9a-z]+)?)/i,
  },
  {
    field: 'sector',
    re: /\bsector\s*[:#.-]?\s*([a-z]{1,2}-?[0-9]{1,2}(?:\/[0-9]{1,2})?)/i,
    transform: (s) => s.toUpperCase(),
  },
  {
    field: 'block',
    re: /\bblock\s*[:#.-]?\s*([a-z]{1,2}(?:-[0-9]{1,2})?|[0-9]{1,3}(?:-[a-z0-9]+)?)\b/i,
    transform: (s) => s.toUpperCase(),
  },
  {
    field: 'phase',
    re: /\bphase\s*[:#.-]?\s*([0-9]{1,2}|[ivx]{1,5})\b/i,
    transform: romanOrDigit,
  },
  {
    field: 'unit',
    re: new RegExp(
      `\\b((?:${SUBUNIT_LABELS.join('|')})\\s*(?:\\.?\\s*no\\.?)?\\s*[:#.-]?\\s*(?:[0-9]+(?:-[a-z0-9]+)?|[a-z]-[0-9]{1,2}))`,
      'i'
    ),
    transform: unitLabel,
  },
  {
    field: 'unit',
    re: /\b([0-9]{1,2}(?:st|nd|rd|th)\s+floor)\b/i,
    transform: floorLabel,
  },
  // Bare-sector must run AFTER block/unit so labeled "Block A-1" / "Flat A-2"
  // win; the labeled `\bsector\b` rule above still beats block.
  {
    field: 'sector',
    re: /(?:^|[,\s])([a-z]-[0-9]{1,2}(?:\/[0-9]{1,2})?)(?=$|[,\s])/i,
    transform: (s) => s.toUpperCase(),
  },
  // Punjab canal-colony chak number: `Chak No. 123/GB`, `Chak 45/JB`,
  // `Chak 7/1-L`. Two guards, each needed, each proven load-bearing against
  // all 4,281 gazetteer names (see test/rules-vs-gazetteer.test.ts):
  //   * lookbehind — `chak` must start its comma segment, so the real names
  //     `Dera Gardawar Chak 108/P` and `Basti Blochan Chak 55p.` are not eaten;
  //   * the bare-number alternative refuses a number followed by another word,
  //     space- OR hyphen-separated, so the real names `Chak 46 NB` / `Chak 42
  //     NB` — and the equally ordinary spelling `Chak 46-NB` — keep resolving
  //     as areas. The branch-code alternatives are therefore split: after `/`
  //     anything word-ish may follow (`123/GB`), but after `-` a digit must
  //     (`7/1-L`, `7-1-L`), because every real hyphen form is digit-led while
  //     every colliding gazetteer name is letter-led.
  //
  // Runs LAST on purpose. Rural addresses are frequently written without
  // commas (`House 12 Chak 45/JB Faisalabad`), where a preceding house/plot
  // token would defeat the segment-start guard. By this point the earlier
  // rules have blanked their own spans to whitespace, so that prefix no longer
  // blocks the match — while a genuine locality prefix (`Dera Gardawar`) is
  // still there and still blocks it. No earlier rule can consume the
  // slash-bearing value: none of their labels match `chak`.
  {
    field: 'chak',
    re: /(?<=(?:^|,)\s*)chak\s*(?:no\.?|#)?\s*(\d{1,4}\/[0-9A-Za-z][0-9A-Za-z-]*|\d{1,4}-\d[0-9A-Za-z-]*|\d{1,4}(?![\s-]*[0-9A-Za-z]))/i,
    transform: (s) => s.toUpperCase(),
  },
];

/**
 * The shipped rule for a field, for tests that must sweep it over the
 * gazetteer corpus. Exported so those tests validate the *shipped* regex
 * rather than a copy that can silently drift out of date.
 */
export function getRules(field: ComponentField): ComponentRule[] {
  return RULES.filter((r) => r.field === field);
}

export function extractComponents(text: string): ComponentResult {
  const matches: ComponentMatch[] = [];
  let working = typeof text === 'string' ? text : '';
  const seen = new Set<ComponentField>();

  for (const rule of RULES) {
    if (seen.has(rule.field)) continue;
    const m = rule.re.exec(working);
    if (!m) continue;
    const captured = m[1];
    const full = m[0];
    if (captured === undefined || full === undefined) continue;
    const rawValue = captured.trim();
    const value = rule.transform ? rule.transform(rawValue) : rawValue;
    matches.push({field: rule.field, value});
    seen.add(rule.field);
    // Blank the full match span so geo resolution and later rules skip it.
    working =
      working.slice(0, m.index) +
      ' '.repeat(full.length) +
      working.slice(m.index + full.length);
  }

  const remainder = working
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .trim();
  return {matches, remainder};
}
