import {mkdirSync, readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {ensureDump} from './geonames.js';
import {writeData} from './emit.js';
import type {Admin, Overrides, RawPlace} from './types.js';

const CANON_PROVINCES = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad Capital Territory',
  'Azad Jammu & Kashmir',
  'Gilgit-Baltistan',
] as const;

// GeoNames admin1 name -> canonical province name
const PROVINCE_MAP: Record<string, string> = {
  Punjab: 'Punjab',
  Sindh: 'Sindh',
  'Khyber Pakhtunkhwa': 'Khyber Pakhtunkhwa',
  Baluchistan: 'Balochistan',
  Balochistan: 'Balochistan',
  Islamabad: 'Islamabad Capital Territory',
  'Federal Capital Territory': 'Islamabad Capital Territory',
  'Azad Kashmir': 'Azad Jammu & Kashmir',
  'Gilgit-Baltistan': 'Gilgit-Baltistan',
  'Northern Areas': 'Gilgit-Baltistan',
  'Federally Administered Tribal Areas': 'Khyber Pakhtunkhwa',
};

const SEAT_CODES = new Set(['PPLC', 'PPLA', 'PPLA2', 'PPLA3', 'PPLA4']);
// Neighbourhoods / sections of populated places + admin seats. Excludes plain
// PPL (rural villages) which would bloat the shipped bundle by ~12 MB.
const AREA_CODES = new Set([
  'PPLX',
  'PPLA',
  'PPLA2',
  'PPLA3',
  'PPLA4',
  'PPLC',
  'PPLL',
]);
const SEAT_RANK: Record<string, number> = {
  PPLC: 0,
  PPLA: 1,
  PPLA2: 2,
  PPLA3: 3,
  PPLA4: 4,
};

interface CityRecord {
  name: string;
  province: string;
  aliases: string[];
  lat: number;
  lng: number;
}

interface AreaRecord {
  name: string;
  city: string;
  province: string;
  aliases: string[];
}

interface Admin2Info {
  districtName: string;
  districtAscii: string;
  provinceName: string;
}

interface Meta {
  source: string;
  license: string;
  generatedAt: string;
  counts: Record<string, number>;
}

/** NFKD diacritic fold: "Muzaffarābād" -> "Muzaffarabad". */
function fold(value: string): string {
  return value.normalize('NFKD').replace(/[̀-ͯ]/g, '').trim();
}

/** Case-insensitive, diacritic-insensitive dedupe key. */
function foldKey(value: string): string {
  return fold(value).toLowerCase();
}

/** Drop blanks and any alias case-insensitively equal to the primary name; dedupe. */
function cleanAliases(primary: string, aliases: string[]): string[] {
  const p = primary.trim().toLowerCase();
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of aliases) {
    const a = raw.trim();
    const key = a.toLowerCase();
    if (a === '' || key === p || seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  return out;
}

/** aliases = folded form + asciiname + curated/extra, minus self. */
function buildAliases(
  primary: string,
  asciiname: string,
  extra: string[]
): string[] {
  return cleanAliases(primary, [fold(primary), asciiname, ...extra]);
}

function uniqProvinceAliases(name: string, aliases: string[]): string[] {
  return [name, ...cleanAliases(name, [fold(name), ...aliases])];
}

/** First `n` ASCII-only alternate names under 40 chars. */
function altAliases(alt: string[], n: number): string[] {
  const ascii = /^[\x20-\x7E]+$/;
  return alt.filter((a) => a.length < 40 && ascii.test(a)).slice(0, n);
}

/** Strip administrative prefixes/suffixes from a district label. */
function cleanDistrictName(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^District of\s+/i, '');
  s = s.replace(/^District\s+/i, '');
  s = s.replace(/\s+District of$/i, '');
  s = s.replace(/\s+(District|Tehsil|Agency|Sub-?division)$/i, '');
  return s.trim();
}

function admin1Of(admin2Code: string): string {
  return admin2Code.split('.').slice(0, 2).join('.');
}

function parseAdmin2(
  admin2: Admin[],
  provinceByAdmin1: Map<string, string>
): Map<string, Admin2Info> {
  const out = new Map<string, Admin2Info>();
  for (const a of admin2) {
    const province = provinceByAdmin1.get(admin1Of(a.code));
    if (province === undefined) continue;
    out.set(a.code, {
      districtName: a.name,
      districtAscii: a.asciiName,
      provinceName: province,
    });
  }
  return out;
}

function districtLabel(info: Admin2Info): string {
  const base =
    info.districtName.trim() !== '' ? info.districtName : info.districtAscii;
  return cleanDistrictName(base);
}

async function main(): Promise<void> {
  const cacheDir = fileURLToPath(new URL('./.cache/', import.meta.url));
  const outDir = fileURLToPath(new URL('../../src/data/', import.meta.url));
  mkdirSync(cacheDir, {recursive: true});
  mkdirSync(outDir, {recursive: true});

  const overrides = JSON.parse(
    readFileSync(
      fileURLToPath(new URL('./overrides.json', import.meta.url)),
      'utf8'
    )
  ) as Overrides;

  console.log('Fetching GeoNames PK dump...');
  const {places, admin1, admin2, dumpDate} = await ensureDump(cacheDir);
  console.log(
    `  parsed ${places.length} P/A places, ${admin1.length} admin1, ${admin2.length} admin2`
  );
  console.log(`  GeoNames dump modification date: ${dumpDate || 'unknown'}`);

  // admin1 code -> canonical province
  const provinceByAdmin1 = new Map<string, string>();
  for (const a of admin1) {
    const canon = PROVINCE_MAP[a.name];
    if (canon === undefined) {
      console.warn(`  skipping unmapped admin1: "${a.name}" (${a.code})`);
      continue;
    }
    provinceByAdmin1.set(a.code, canon);
  }

  // FIX 1 (kept): every canonical province MUST be reachable from the admin1 mapping.
  const covered = new Set(provinceByAdmin1.values());
  const missing = CANON_PROVINCES.filter((p) => !covered.has(p));
  if (missing.length > 0) {
    throw new Error(
      `admin1->province mapping does not cover: ${missing.join(', ')}. ` +
        `GeoNames admin1 names on this dump: ${admin1.map((a) => `"${a.name}"`).join(', ')}. ` +
        `Update PROVINCE_MAP in scripts/build-data/index.ts.`
    );
  }

  const admin2Info = parseAdmin2(admin2, provinceByAdmin1);

  function provinceOfPlace(place: RawPlace): string | undefined {
    const viaAdmin2 = place.admin2
      ? admin2Info.get(place.admin2)?.provinceName
      : undefined;
    return (
      viaAdmin2 ??
      (place.admin1 ? provinceByAdmin1.get(place.admin1) : undefined)
    );
  }

  // seats: best-ranked seat place per admin2 code
  const seatByAdmin2 = new Map<string, RawPlace>();
  for (const p of places) {
    if (
      p.featureClass !== 'P' ||
      !SEAT_CODES.has(p.featureCode) ||
      p.admin2 === ''
    )
      continue;
    const current = seatByAdmin2.get(p.admin2);
    const rank = SEAT_RANK[p.featureCode] ?? 9;
    const currentRank = current ? (SEAT_RANK[current.featureCode] ?? 9) : 99;
    if (!current || rank < currentRank) seatByAdmin2.set(p.admin2, p);
  }

  // Tehsil-seat fallback: districts GeoNames left without a PPLA* seat but that
  // have a large populated place (e.g. Mingora in Swat, tagged only PPL).
  const FALLBACK_SEAT_MIN_POP = 25000;
  const fallbackSeat = new Map<string, RawPlace>();
  for (const p of places) {
    if (
      p.featureClass !== 'P' ||
      !p.featureCode.startsWith('PPL') ||
      p.admin2 === ''
    )
      continue;
    if (seatByAdmin2.has(p.admin2) || !admin2Info.has(p.admin2)) continue;
    if (p.population < FALLBACK_SEAT_MIN_POP) continue;
    const current = fallbackSeat.get(p.admin2);
    if (!current || p.population > current.population)
      fallbackSeat.set(p.admin2, p);
  }
  for (const [code, p] of fallbackSeat) seatByAdmin2.set(code, p);

  // cities, keyed by diacritic-folded lowercased primary name
  const cities = new Map<string, CityRecord>();

  function addCity(
    name: string,
    province: string,
    lat: number,
    lng: number,
    aliases: string[],
    asciiname = ''
  ): void {
    const primary = name.trim();
    if (primary === '') return;
    const key = foldKey(primary);
    const existing = cities.get(key);
    if (existing) {
      const merged = [
        ...existing.aliases,
        ...aliases,
        asciiname,
        fold(primary),
      ];
      if (primary.toLowerCase() !== existing.name.toLowerCase())
        merged.push(primary);
      existing.aliases = cleanAliases(existing.name, merged);
      if (
        existing.lat === 0 &&
        existing.lng === 0 &&
        (lat !== 0 || lng !== 0)
      ) {
        existing.lat = lat;
        existing.lng = lng;
      }
      return;
    }
    cities.set(key, {
      name: primary,
      province,
      aliases: buildAliases(primary, asciiname, aliases),
      lat,
      lng,
    });
  }

  // 1. admin2 seats (primary name = GeoNames column [1])
  for (const [code, seat] of seatByAdmin2) {
    const province =
      admin2Info.get(code)?.provinceName ?? provinceOfPlace(seat);
    if (province === undefined) continue;
    addCity(seat.name, province, seat.lat, seat.lng, [], seat.asciiname);
  }

  // 2. seat-coded places without an admin2 (federal capital, provincial capitals
  //    GeoNames leaves unassigned)
  for (const p of places) {
    if (p.featureClass !== 'P' || !SEAT_CODES.has(p.featureCode)) continue;
    const province = provinceOfPlace(p);
    if (province === undefined) continue;
    addCity(p.name, province, p.lat, p.lng, [], p.asciiname);
  }

  // 3. FIX C: every admin2 district name is a city. If it diacritic-folds to an
  //    existing seat city it becomes an alias of that seat; otherwise a new row.
  for (const info of admin2Info.values()) {
    addCity(districtLabel(info), info.provinceName, 0, 0, []);
  }

  // overrides.cityAliases — match the city by the key OR any listed alias
  // (GeoNames' spelling may itself be a variant, e.g. "Shekhupura"), then add
  // every other spelling as an alias.
  for (const [cityName, aliases] of Object.entries(overrides.cityAliases)) {
    const spellings = [cityName, ...aliases];
    let record = spellings
      .map((s) => cities.get(foldKey(s)))
      .find((r) => r !== undefined);
    if (!record) {
      const keys = new Set(spellings.map(foldKey));
      record = [...cities.values()].find(
        (c) =>
          keys.has(foldKey(c.name)) ||
          c.aliases.some((a) => keys.has(foldKey(a)))
      );
    }
    if (!record) {
      console.warn(
        `  cityAliases override: "${cityName}" not present in gazetteer`
      );
      continue;
    }
    record.aliases = cleanAliases(record.name, [
      ...record.aliases,
      ...spellings,
    ]);
  }

  // area -> city: prefer the admin2 seat (column [1]), else the cleaned district name
  function cityForAdmin2(
    code: string
  ): {name: string; province: string} | null {
    const seat = seatByAdmin2.get(code);
    const info = admin2Info.get(code);
    if (seat) {
      const province = info?.provinceName ?? provinceOfPlace(seat);
      if (province) return {name: seat.name, province};
    }
    if (info) return {name: districtLabel(info), province: info.provinceName};
    return null;
  }

  // areas = qualifying P places that are not themselves a city
  const areas: AreaRecord[] = [];
  const areaIndex = new Map<string, number>();
  for (const p of places) {
    if (p.featureClass !== 'P' || !AREA_CODES.has(p.featureCode)) continue;
    if (p.admin2 === '') continue;
    if (cities.has(foldKey(p.name))) continue;
    const city = cityForAdmin2(p.admin2);
    if (!city || city.name === '') continue;
    const dedupeKey = `${foldKey(p.name)}|${foldKey(city.name)}`;
    if (areaIndex.has(dedupeKey)) continue;
    areaIndex.set(dedupeKey, areas.length);
    areas.push({
      name: p.name,
      city: city.name,
      province: city.province,
      aliases: cleanAliases(p.name, [
        fold(p.name),
        p.asciiname,
        ...altAliases(p.alt, 3),
      ]),
    });
  }

  // Within a city an override claims, a curated area name outranks a GeoNames
  // alternate name. Without this, plain "Latifabad" existed in the gazetteer
  // only as an alternate name of the record "Latifabad Number Ten", so every
  // bare "Latifabad, Hyderabad" resolved to Unit 10 specifically.
  //
  // Scoped per (name, city), NOT globally: "Model Town" is an override for
  // Lahore but also a legitimate GeoNames alias of "New Town" in Hyderabad,
  // and dropping that one would lose "Model Town, Hyderabad" entirely. An
  // override only speaks for the cities it lists.
  //
  // The numbered Latifabad records — and the word "number" — are untouched.
  const overrideAreaKeys = new Set<string>();
  for (const o of overrides.areas)
    for (const c of o.cities)
      overrideAreaKeys.add(`${foldKey(o.name)}|${foldKey(c)}`);
  for (const a of areas) {
    a.aliases = a.aliases.filter(
      (al) => !overrideAreaKeys.has(`${foldKey(al)}|${foldKey(a.city)}`)
    );
  }

  // merge overrides.areas (kept unconditionally)
  for (const ov of overrides.areas) {
    for (const cityName of ov.cities) {
      const record = cities.get(foldKey(cityName));
      if (!record) {
        console.warn(
          `  area override "${ov.name}": city "${cityName}" not in gazetteer`
        );
        continue;
      }
      const dedupeKey = `${foldKey(ov.name)}|${foldKey(record.name)}`;
      const entry: AreaRecord = {
        name: ov.name,
        city: record.name,
        province: record.province,
        aliases: cleanAliases(ov.name, [fold(ov.name), ...ov.aliases]),
      };
      const existing = areaIndex.get(dedupeKey);
      if (existing === undefined) {
        areaIndex.set(dedupeKey, areas.length);
        areas.push(entry);
      } else {
        areas[existing] = entry;
      }
    }
  }

  // provinces
  const provinceList = CANON_PROVINCES.map((name) => ({
    name,
    aliases: uniqProvinceAliases(name, overrides.provinceAliases[name] ?? []),
  }));

  const cityList = [...cities.values()].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  areas.sort(
    (a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name)
  );

  // FIX 1 (kept): every canonical province MUST have at least one city.
  const cityCountByProvince = new Map<string, number>();
  for (const c of cityList) {
    cityCountByProvince.set(
      c.province,
      (cityCountByProvince.get(c.province) ?? 0) + 1
    );
  }
  const emptyProvinces = CANON_PROVINCES.filter(
    (p) => (cityCountByProvince.get(p) ?? 0) === 0
  );
  if (emptyProvinces.length > 0) {
    throw new Error(
      `province(s) with zero cities after build: ${emptyProvinces.join(', ')}. ` +
        `Refusing to write partial data.`
    );
  }

  const generatedAt = new Date().toISOString();
  const meta = (): Meta => ({
    source: 'GeoNames',
    license: 'CC BY 4.0',
    generatedAt,
    counts: {
      provinces: provinceList.length,
      cities: cityList.length,
      areas: areas.length,
    },
  });

  writeData(outDir, {
    provinces: {_meta: meta(), provinces: provinceList},
    cities: {_meta: meta(), cities: cityList},
    areas: {_meta: meta(), areas},
  });

  console.log(
    `Wrote provinces=${provinceList.length} cities=${cityList.length} areas=${areas.length} to src/data/`
  );
  for (const p of CANON_PROVINCES) {
    console.log(`  ${p}: ${cityCountByProvince.get(p) ?? 0} cities`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
