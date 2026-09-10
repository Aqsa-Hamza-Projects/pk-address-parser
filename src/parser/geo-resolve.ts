import {getStore, normalizeKey} from '../geo/store.js';
import type {
  AreaRecord,
  GeoResolution,
  Tok,
  TokenWindow,
} from '../interfaces/index.js';

const MAX_WINDOW = 3;

function tokenize(text: string): Tok[] {
  return (typeof text === 'string' ? text : '')
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((raw) => ({raw, used: false}));
}

function anyUsed(slice: Tok[]): boolean {
  return slice.some((t) => t.used);
}

function windowKey(slice: Tok[]): string {
  return normalizeKey(slice.map((t) => t.raw).join(' '));
}

/**
 * Trailing windows of unused tokens, ordered latest-ending first and, for each
 * ending token, longest first — so the first match is the longest trailing hit.
 */
function trailingWindows(toks: Tok[]): TokenWindow[] {
  const out: TokenWindow[] = [];
  for (let end = toks.length - 1; end >= 0; end--) {
    const endTok = toks[end];
    if (!endTok || endTok.used) continue;
    for (let len = Math.min(MAX_WINDOW, end + 1); len >= 1; len--) {
      const start = end - len + 1;
      if (start < 0) continue;
      const slice = toks.slice(start, start + len);
      if (anyUsed(slice)) continue;
      out.push({start, len, slice});
    }
  }
  return out;
}

export function resolveGeo(
  text: string,
  opts: {defaultCity?: string; defaultProvince?: string} = {}
): GeoResolution {
  const store = getStore();
  const toks = tokenize(text);
  if (toks.length === 0 && !opts.defaultCity && !opts.defaultProvince) {
    return {province: null, city: null, area: null, leftover: []};
  }

  let province: string | null = null;
  let city: string | null = null;
  let area: string | null = null;

  const markUsed = (start: number, len: number): void => {
    for (let i = start; i < start + len; i++) {
      const t = toks[i];
      if (t) t.used = true;
    }
  };

  // 1. province — longest trailing window (≤ 3 words). If the matched window is
  // also a city key (e.g. "Islamabad"), record the province but leave the tokens
  // unused so the city step can still claim them.
  for (const w of trailingWindows(toks)) {
    const key = windowKey(w.slice);
    const hit = store.provinceByKey.get(key);
    if (hit) {
      province = hit.name;
      if (!store.cityByKey.has(key)) markUsed(w.start, w.len);
      break;
    }
  }

  // 2. city — longest trailing window of what remains
  for (const w of trailingWindows(toks)) {
    const hits = store.cityByKey.get(windowKey(w.slice));
    if (!hits || hits.length === 0) continue;
    const matched = province
      ? hits.find((c) => c.province === province)
      : undefined;
    const chosen = matched ?? hits[0];
    if (chosen) {
      city = chosen.name;
      if (!province) province = chosen.province;
      markUsed(w.start, w.len);
    }
    break;
  }

  // 3. area — best window anywhere. Rank candidates by (cityMatch, len): a
  // record whose .city equals the resolved city beats any non-matching one
  // regardless of length; otherwise longer wins; ties keep the earliest start.
  let bestArea: {
    rec: AreaRecord;
    hits: AreaRecord[];
    start: number;
    len: number;
    cityMatch: boolean;
  } | null = null;
  for (let start = 0; start < toks.length; start++) {
    const startTok = toks[start];
    if (!startTok || startTok.used) continue;
    for (let len = Math.min(MAX_WINDOW, toks.length - start); len >= 1; len--) {
      const slice = toks.slice(start, start + len);
      if (anyUsed(slice)) continue;
      const hits = store.areaByKey.get(windowKey(slice));
      if (!hits || hits.length === 0) continue;
      const matched = city ? hits.find((a) => a.city === city) : undefined;
      const rec = matched ?? hits[0];
      if (!rec) break;
      const cityMatch = Boolean(matched);
      if (
        !bestArea ||
        (cityMatch && !bestArea.cityMatch) ||
        (cityMatch === bestArea.cityMatch && len > bestArea.len)
      ) {
        bestArea = {rec, hits, start, len, cityMatch};
      }
      break;
    }
  }
  if (bestArea) {
    area = bestArea.rec.name;
    markUsed(bestArea.start, bestArea.len);
    // Only infer city/province from the area record when that area key maps to a
    // single distinct city. A multi-city society ("DHA", "Cantt") with no city
    // token must not pick one arbitrarily.
    const singleCity = new Set(bestArea.hits.map((h) => h.city)).size === 1;
    if (!city && singleCity) city = bestArea.rec.city;
    if (!province && city && singleCity) province = bestArea.rec.province;
  }

  // 4. defaults + inference
  if (!city && opts.defaultCity) city = opts.defaultCity;
  if (!province && city) {
    const ch = store.cityByKey.get(normalizeKey(city))?.[0];
    if (ch) province = ch.province;
  }
  if (!province && opts.defaultProvince) province = opts.defaultProvince;

  const leftover = toks.filter((t) => !t.used).map((t) => t.raw);
  return {province, city, area, leftover};
}
