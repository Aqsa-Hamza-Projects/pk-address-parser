# pk-address-parser

**Parse, normalize and standardize messy Pakistani addresses** into structured
fields — house, street, block, sector, phase, unit, landmark, area, city and
province — with a small geo helper API (province ↔ city ↔ area lookups) backed by
a bundled Pakistan gazetteer. Written in **TypeScript**, ships with type
declarations, and has **zero runtime dependencies**. It works unchanged in
TypeScript, in plain JavaScript with `import` (ESM), and in plain JavaScript with
`require` (CommonJS) — **no build step and no TypeScript toolchain required by
the consumer**. Everything runs offline; there are no network calls at runtime.

Built for Pakistani e-commerce, logistics, delivery, courier, real-estate and CRM
systems that need to turn free-text `parse` / `normalize` / `standardize` input
into clean, queryable records.

## Badges

[![npm version](https://img.shields.io/npm/v/pk-address-parser)](https://www.npmjs.com/package/pk-address-parser)
[![license MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![types included](https://img.shields.io/badge/types-TypeScript-blue.svg)](https://www.npmjs.com/package/pk-address-parser)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](./package.json)

## Why

Pakistani e-commerce, delivery/logistics, property and CRM systems constantly
deal with inconsistent, free-text addresses:

```
House 23, Street 4, Block B, Johar Town, Lahore
DHA Phase 6 Lahore
Near Emporium Mall, Johar Town, Lahore
```

There is no widely-used, typed, offline library that turns these into structured
records and resolves the locality / city / province. This package fills that gap.

```ts
import {parseAddress} from 'pk-address-parser';

parseAddress({address: 'House 23, Street 4, Block B, Johar Town, Lahore'});
// {
//   house: '23', street: '4', block: 'B',
//   sector: null, phase: null, unit: null, landmark: null,
//   area: 'Johar Town', city: 'Lahore', province: 'Punjab',
//   country: 'Pakistan',
//   phone: null,
//   raw: 'House 23, Street 4, Block B, Johar Town, Lahore',
//   unmatched: [], confidence: 0.95
// }
```

## Install

```bash
npm install pk-address-parser
```

```bash
pnpm add pk-address-parser
```

```bash
yarn add pk-address-parser
```

Requires Node.js >= 18. No peer dependencies, no runtime dependencies.

## Quick start

The package publishes a dual **ESM + CommonJS** build with `.d.ts` / `.d.cts`
type declarations. Use whichever module system your project already uses — you
do **not** need TypeScript, a bundler, or a build step to consume it.

### TypeScript

```ts
import {
  parseAddress,
  normalizeAddress,
  type ParsedAddress,
} from 'pk-address-parser';

const parsed: ParsedAddress = parseAddress({
  address: 'House 23, Street 4, Block B, Johar Town, Lahore',
});

normalizeAddress({address: 'lahore johar town'});
// 'Johar Town, Lahore, Punjab, Pakistan'
```

### Plain JavaScript — ESM (`import`)

```js
// index.mjs  (or "type": "module" in package.json)
import {parseAddress} from 'pk-address-parser';

console.log(parseAddress({address: 'DHA Phase 6 Lahore'}));
// {
//   house: null, street: null, block: null, sector: null,
//   phase: '6', unit: null, landmark: null,
//   area: 'DHA', city: 'Lahore', province: 'Punjab', country: 'Pakistan',
//   phone: null,
//   raw: 'DHA Phase 6 Lahore', unmatched: [], confidence: 0.85
// }
```

### Plain JavaScript — CommonJS (`require`)

```js
// index.cjs  (or a plain CommonJS project)
const {parseAddress, normalizeAddress} = require('pk-address-parser');

console.log(parseAddress({address: 'Near Emporium Mall, Johar Town, Lahore'}));
// {
//   house: null, street: null, block: null, sector: null, phase: null,
//   unit: null, landmark: 'Near Emporium Mall',
//   area: 'Johar Town', city: 'Lahore', province: 'Punjab',
//   country: 'Pakistan', phone: null,
//   raw: 'Near Emporium Mall, Johar Town, Lahore',
//   unmatched: [], confidence: 0.8
// }
```

Every function takes a **single named-parameters object** — never positional
arguments. Malformed input never throws: a missing or empty `address` returns an
all-`null` `ParsedAddress` with `confidence: 0`.

## API

All exports come from the package root (`pk-address-parser`).

| Export             | Signature                                                                 |
| ------------------ | ------------------------------------------------------------------------- |
| `parseAddress`     | `({ address, defaultCity?, defaultProvince?, strict? }) => ParsedAddress` |
| `normalizeAddress` | `({ address, defaultCity?, defaultProvince?, strict? }) => string`        |
| `getProvince`      | `({ city }) => string \| null`                                            |
| `getCity`          | `({ province, city }) => string \| null`                                  |
| `listProvinces`    | `() => string[]`                                                          |
| `listCities`       | `({ province? }) => string[]`                                             |
| `listAreas`        | `({ city }) => string[]`                                                  |
| `isProvince`       | `({ name }) => boolean`                                                   |
| `isCity`           | `({ name }) => boolean`                                                   |

Plus the exported types `ParsedAddress` and `ParseAddressParams`.

### `parseAddress({ address, defaultCity?, defaultProvince?, strict? })`

Parses a raw address into a `ParsedAddress`. `defaultCity` / `defaultProvince`
fill in `city` / `province` when the input (and the gazetteer) cannot. With
`strict: true`, an unrecognized leftover segment is **not** guessed as `area` —
it goes to `unmatched` instead. Even with `strict: false` (the default), a
leftover is only guessed as `area` when it reads like a place name: one with no
letters, one that is all digits or bare ordinals, an `Nth Floor` or a `Unit N`
goes to `unmatched` regardless.

```ts
parseAddress({address: 'DHA Phase 6 Lahore'});
// -> { phase: '6', area: 'DHA', city: 'Lahore', province: 'Punjab', ... }

parseAddress({address: 'st 4 gulberg', defaultCity: 'Lahore'});
// -> { street: '4', area: 'Gulberg', city: 'Lahore', province: 'Punjab', ... }

parseAddress({address: 'some unknown colony', strict: true});
// -> { area: null, unmatched: ['some', 'unknown', 'colony'], ... }
```

`house`, `street`, `block`, `sector` and `phase` return **just the identifying
value** (`'23'`, `'B'`, `'F-8/3'`), not the label. `unit` **keeps its label**,
title-cased (`'Flat 3'`, `'Apartment 12-C'`, `'2nd Floor'`). `landmark` keeps its
leading preposition (`'Near Emporium Mall'`). `area` / `city` / `province` are
canonical gazetteer names.

### `normalizeAddress({ address, defaultCity?, defaultProvince?, strict? })`

Parses, then re-emits the non-null parts in a fixed specific → general order as a
single comma-separated string ending in `Pakistan`. If parsing resolves nothing,
returns the input trimmed and whitespace-collapsed (never an empty string).

```ts
normalizeAddress({address: 'lahore johar town'});
// 'Johar Town, Lahore, Punjab, Pakistan'

normalizeAddress({address: 'h#7 st 12 f-8/3 islamabad'});
// 'House 7, Street 12, Sector F-8/3, Islamabad Capital Territory, Pakistan'
```

### `getProvince({ city })`

Returns the province for a city, or `null` if unknown. Case-, whitespace- and
alias-insensitive.

```ts
getProvince({city: 'Lahore'}); // 'Punjab'
getProvince({city: 'khi'}); // 'Sindh'
getProvince({city: 'Gotham'}); // null
```

### `getCity({ province, city })`

Returns the canonical city name **only if** that city exists in that province,
otherwise `null`. Both arguments are alias-aware.

```ts
getCity({province: 'Punjab', city: 'lhr'}); // 'Lahore'
getCity({province: 'Sindh', city: 'Lahore'}); // null (not in Sindh)
```

### `listProvinces()`

Returns all 7 canonical province names in a stable order. Takes no arguments.

```ts
listProvinces();
// ['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan',
//  'Islamabad Capital Territory', 'Azad Jammu & Kashmir', 'Gilgit-Baltistan']
```

### `listCities({ province? })`

Returns canonical city names, sorted. With `province` (alias-aware) the list is
filtered to that province; an unknown province returns `[]`. With no argument or
`{}`, returns every city.

```ts
listCities({province: 'Sindh'}); // ['Badin', 'Dadu', 'Ghotki', 'Hyderabad', ...]
listCities(); // every city in the gazetteer
```

### `listAreas({ city })`

Returns the canonical locality names known for a city, sorted. `[]` if the city
is unknown or has no localities in the dataset.

```ts
listAreas({city: 'Lahore'}); // ['A Block', 'Abbas Lines', 'Abbasabad', ...]
```

### `isProvince({ name })` / `isCity({ name })`

Alias-aware boolean membership tests.

```ts
isProvince({name: 'KPK'}); // true
isCity({name: 'Faisalabad'}); // true
isCity({name: 'Gotham'}); // false
```

### `ParsedAddress`

| Field        | Type             | Notes                                                                      |
| ------------ | ---------------- | -------------------------------------------------------------------------- |
| `house`      | `string \| null` | Value only — `'23'`, `'5-A'`, `'23'` from `#23` / `Plot 5`                 |
| `street`     | `string \| null` | Value only — `'4'` from `Street 4` / `St 4` / `St. 4`                      |
| `block`      | `string \| null` | Value only, upper-cased — `'B'`, `'12-C'`                                  |
| `sector`     | `string \| null` | Value only, upper-cased — `'F-8/3'`, `'G-9'` (Islamabad / Karachi)         |
| `phase`      | `string \| null` | Value only — `'6'`; Roman numerals folded to digits (`II` → `'2'`)         |
| `unit`       | `string \| null` | `'Flat 3'`, `'Apartment 12-C'`, `'2nd Floor'`, `'Shop 4'`                  |
| `landmark`   | `string \| null` | Keeps its preposition — `'Near Emporium Mall'`, `'Opposite ...'`           |
| `area`       | `string \| null` | Resolved locality, canonical gazetteer name — `'Johar Town'`               |
| `city`       | `string \| null` | Resolved / inferred city — `'Lahore'`                                      |
| `province`   | `string \| null` | Resolved / inferred province — `'Punjab'`                                  |
| `country`    | `'Pakistan'`     | Constant                                                                   |
| `phone`      | `string \| null` | PK mobile / landline found in the input, national digits — `'03001234567'` |
| `raw`        | `string`         | The original input, untouched                                              |
| `unmatched`  | `string[]`       | Tokens that could not be classified (original casing)                      |
| `confidence` | `number`         | `0`–`1` heuristic — **advisory only**, not a probability                   |

**`confidence` is advisory.** It is a rough `[0, 1]` score:
`+0.35` province, `+0.30` city, `+0.15` area, `+0.05` each for house / street /
block / sector / phase (capped at `+0.20`), minus `0.15 × min(unmatched, 3) / 3`,
clamped and rounded to 2 decimals. Use it to triage / flag addresses for review,
not as a hard gate.

## Data & coverage

The bundled gazetteer is generated from [GeoNames](https://www.geonames.org/)
(the Pakistan `PK` dump plus `admin1` / `admin2` codes) merged with a curated
`scripts/build-data/overrides.json` (province and city aliases; well-known
housing societies and schemes such as DHA, Bahria Town, Gulberg, Model Town,
Johar Town, Clifton, PECHS, Blue Area, Hayatabad, Cantt). The current build
carries **7 provinces, ~204 cities/districts and ~3,230 localities**.

- **Administrative hierarchy (province → district/city) is complete** from
  GeoNames.
- **Locality / street-level coverage is best-effort.** There is no authoritative
  complete source; the parser **degrades gracefully** — an unknown locality token
  is kept (in `area` when it is the only leftover, `strict` is off, AND it reads
  like a place name — otherwise in `unmatched`), and `city` / `province` still
  resolve and `normalizeAddress` still works.

To extend coverage, edit `scripts/build-data/overrides.json` and re-run the
pipeline:

```bash
npm run build:data   # fetches GeoNames, rebuilds src/data/*.json (committed output)
```

`npm run build:data` is **manual** and its output (`src/data/*.json`) is
committed to the repo — `npm install` and `npm run build` never touch the
network.

## Known limitations

- **Locality coverage is best-effort.** The gazetteer is GeoNames
  populated-places plus curated societies/schemes. An unknown locality is kept in
  `unmatched` or, in non-strict mode, guessed as `area` with a reduced
  `confidence` (no `+0.15` area credit and an extra `-0.10`) so it still flags for
  review.
- **A leading `"St"` is expanded to `"Street"`** by abbreviation handling, so
  `"St Johns"` normalizes to `"Street Johns"`.
- **One `area` slot and one `unit` slot.** Extra locality or unit descriptors
  (e.g. a second `"2nd Floor"` after a `"Flat 3"`) go to `unmatched`.
- **A bare multi-city society name** (`"DHA"`, `"Cantt"`) with no city token
  will not resolve a `city` or `province` — it would otherwise have to guess one
  arbitrarily. Pass `defaultCity` or include the city in the input.

## Examples

Runnable scripts covering every public function live in
[`examples/`](./examples) (not shipped in the npm tarball, but exercised by the
test suite so they never rot):

```bash
npm run examples
```

| File                      | Shows                                                 |
| ------------------------- | ----------------------------------------------------- |
| `01-parse-address.ts`     | `parseAddress` on the three canonical inputs          |
| `02-normalize-address.ts` | `normalizeAddress` before / after pairs               |
| `03-geo-helpers.ts`       | all seven geo helpers                                 |
| `04-batch-cleanup.ts`     | batch cleanup of dirty addresses to structured rows   |
| `05-commonjs.cjs`         | the CommonJS build via `require('pk-address-parser')` |
| `06-esm.mjs`              | the ESM build via `import` in plain JavaScript        |

## Changelog

All notable changes are recorded in [CHANGELOG.md](./CHANGELOG.md), following
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Contributing

Issues and pull requests are welcome at the
[GitHub repository](https://github.com/Aqsa-Hamza-Projects/pk-address-parser).
After cloning, enable the Git pre-commit hook once:

```bash
npm install
npm run hooks:install
```

The local gate that must pass:

```bash
npm run typecheck && npm run lint && npm run format:check && npm run build && npm test && npm run examples
```

The most useful contribution is expanding `scripts/build-data/overrides.json`
with real localities, societies and aliases, then committing the regenerated
`src/data/*.json`.

## License

MIT © Aqsa LogicByte. See [LICENSE](./LICENSE).

## Attribution

Geographic data derived from [GeoNames](https://www.geonames.org/), licensed
under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
