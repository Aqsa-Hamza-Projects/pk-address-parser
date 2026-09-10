import {getStore, normalizeKey} from './store.js';

const CANONICAL_PROVINCES: readonly string[] = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad Capital Territory',
  'Azad Jammu & Kashmir',
  'Gilgit-Baltistan',
];

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export function getProvince(params: {city: string}): string | null {
  const city = asString(params?.city);
  if (!city) return null;
  const hits = getStore().cityByKey.get(normalizeKey(city));
  const first = hits?.[0];
  return first ? first.province : null;
}

export function getCity(params: {
  province: string;
  city: string;
}): string | null {
  const province = asString(params?.province);
  const city = asString(params?.city);
  if (!province || !city) return null;
  const store = getStore();
  const prov = store.provinceByKey.get(normalizeKey(province));
  if (!prov) return null;
  const hits = store.cityByKey.get(normalizeKey(city)) ?? [];
  const match = hits.find((c) => c.province === prov.name);
  return match ? match.name : null;
}

export function listProvinces(): string[] {
  return [...CANONICAL_PROVINCES];
}

export function listCities(params?: {province?: string}): string[] {
  const store = getStore();
  let list = store.cities;
  if (params?.province !== undefined) {
    const province = asString(params.province);
    const prov = province
      ? store.provinceByKey.get(normalizeKey(province))
      : undefined;
    if (!prov) return [];
    list = list.filter((c) => c.province === prov.name);
  }
  return [...new Set(list.map((c) => c.name))].sort();
}

export function listAreas(params: {city: string}): string[] {
  const city = asString(params?.city);
  if (!city) return [];
  const store = getStore();
  const cityHit = store.cityByKey.get(normalizeKey(city))?.[0];
  const canonicalKey = normalizeKey(cityHit ? cityHit.name : city);
  const names = store.areas
    .filter((a) => normalizeKey(a.city) === canonicalKey)
    .map((a) => a.name);
  return [...new Set(names)].sort();
}

export function isProvince(params: {name: string}): boolean {
  const name = asString(params?.name);
  return name !== null && getStore().provinceByKey.has(normalizeKey(name));
}

export function isCity(params: {name: string}): boolean {
  const name = asString(params?.name);
  return name !== null && getStore().cityByKey.has(normalizeKey(name));
}
