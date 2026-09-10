import {emptyResult} from '../result.js';
import type {
  ParseAddressParams,
  ParsedAddress,
  GeoResolution,
} from '../interfaces/index.js';
import {normalizeInput} from '../normalize/index.js';
import {extractComponents} from './components.js';
import {extractLandmark} from './landmark.js';
import {resolveGeo} from './geo-resolve.js';
import {assemble} from './assemble.js';

export function parseAddress(params: ParseAddressParams): ParsedAddress {
  const address = (params as {address?: unknown} | undefined)?.address;
  const raw = String(address ?? '');
  if (typeof address !== 'string' || address.trim() === '') {
    return emptyResult(raw);
  }

  const defaults = {
    defaultCity: params.defaultCity,
    defaultProvince: params.defaultProvince,
  };

  const {segments} = normalizeInput(address);

  let landmark: string | null = null;
  let landmarkPrep = '';
  let landmarkRest = '';
  const geoSegments: string[] = [];
  for (const seg of segments) {
    if (landmark === null) {
      const found = extractLandmark(seg);
      if (found.landmark !== null) {
        landmark = found.landmark;
        landmarkPrep = found.preposition ?? '';
        landmarkRest = found.rest ?? '';
        continue;
      }
    }
    geoSegments.push(seg);
  }

  const {matches, remainder} = extractComponents(geoSegments.join(', '));
  const geo = resolveGeo(remainder, defaults);

  if (landmark !== null) {
    const lmGeo = resolveGeo(landmarkRest, defaults);
    const merged: GeoResolution = {
      province: geo.province ?? lmGeo.province,
      city: geo.city ?? lmGeo.city,
      area: geo.area ?? lmGeo.area,
      leftover: geo.leftover,
    };
    const kept = lmGeo.leftover.join(' ').trim();
    const rebuilt = kept ? `${landmarkPrep} ${kept}`.trim() : landmarkPrep;
    return assemble({
      raw,
      components: matches,
      landmark: rebuilt === '' ? landmark : rebuilt,
      geo: merged,
      strict: params.strict ?? false,
    });
  }

  return assemble({
    raw,
    components: matches,
    landmark,
    geo,
    strict: params.strict ?? false,
  });
}
