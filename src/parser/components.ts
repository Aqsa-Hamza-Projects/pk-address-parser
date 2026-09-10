import type {ComponentField} from '../types/index.js';
import type {
  ComponentMatch,
  ComponentResult,
  ComponentRule,
} from '../interfaces/index.js';

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
  {field: 'house', re: /(?:^|[(,\s])#\s*([0-9]+[a-z]?(?:[/-][0-9a-z]+)*)/i},
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
    re: /\b((?:flat|apartment|suite|room|shop|office)\s*(?:\.?\s*no\.?)?\s*[:#.-]?\s*(?:[0-9]+(?:-[a-z0-9]+)?|[a-z]-[0-9]{1,2}))/i,
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
];

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
