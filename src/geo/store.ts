import provincesJson from '../data/provinces.json' with {type: 'json'};
import citiesJson from '../data/cities.json' with {type: 'json'};
import areasJson from '../data/areas.json' with {type: 'json'};
import type {
  ProvinceRecord,
  CityRecord,
  AreaRecord,
  GeoStore,
} from '../interfaces/index.js';

export function normalizeKey(value: string): string {
  return (typeof value === 'string' ? value : '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[._'"`()]/g, '')
    .replace(/[^a-z0-9؀-ۿ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

let cache: GeoStore | null = null;

function pushMulti<T>(map: Map<string, T[]>, key: string, value: T): void {
  if (!key) return;
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

export function getStore(): GeoStore {
  if (cache) return cache;

  const provinces = (provincesJson as {provinces: ProvinceRecord[]}).provinces;
  const cities = (citiesJson as {cities: CityRecord[]}).cities;
  const areas = (areasJson as {areas: AreaRecord[]}).areas;

  const provinceByKey = new Map<string, ProvinceRecord>();
  for (const p of provinces) {
    provinceByKey.set(normalizeKey(p.name), p);
    for (const a of p.aliases) provinceByKey.set(normalizeKey(a), p);
  }

  const cityByKey = new Map<string, CityRecord[]>();
  for (const c of cities) {
    pushMulti(cityByKey, normalizeKey(c.name), c);
    for (const a of c.aliases) pushMulti(cityByKey, normalizeKey(a), c);
  }

  const areaByKey = new Map<string, AreaRecord[]>();
  for (const ar of areas) {
    pushMulti(areaByKey, normalizeKey(ar.name), ar);
    for (const a of ar.aliases) pushMulti(areaByKey, normalizeKey(a), ar);
  }

  cache = {provinces, cities, areas, provinceByKey, cityByKey, areaByKey};
  return cache;
}
