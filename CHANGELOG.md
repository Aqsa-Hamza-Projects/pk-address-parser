# Changelog

All notable changes to **pk-address-parser**.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**How to maintain this file:** on each release, add a new
`## [x.y.z] — YYYY-MM-DD` section on top (matching the `package.json` bump),
grouped into _Added_ / _Changed_ / _Fixed_ / _Removed_.

## [Unreleased]

### Added

- Roman-Urdu house and street labels (`makan`, `ghar`, `bangla`, `bunglow`,
  `bungalow`, `villa`, `makaan`, `gali`, `galli`, `koocha`, `kucha`, `lane`)
  and the number words `no`/`nos`/`num`/`nmbr`/`number`, so
  `makan no 12 gali 5 johar town lahore` now yields `house: '12'`,
  `street: '5'`. A label is matched only when a number follows it, so the
  several hundred localities whose names contain one — `Makan Bagh`,
  `Sund Gali`, `Ghanta Ghar`, `Qasim Lane`, 188 places beginning `Goth …` —
  are unaffected. A Roman-Urdu label is additionally ignored when a word
  precedes it, so a locality that _ends_ in a label word survives a trailing
  number too: `Sund Gali 5` stays `area: 'Sund Gali'`. Pinned by a test that
  runs the rules over all 4,281 gazetteer names and aliases, bare and with a
  number appended, and asserts zero matches.
- Roman-Urdu landmark prepositions: `qareeb`, `kareeb`, `nazdeek`, `k paas`,
  `k samne`, `k pichay`, `k saath` (and the `ke` spellings), plus `nearby`,
  `near by`, `next to` and `close to`. All canonicalize to the English term the
  package already emits, so `qareeb X` and `near X` both give `Near X`.
- Automated OIDC npm publishing workflow via GitHub Actions (`.github/workflows/publish.yml`).

### Changed

- `nearby <place>` is now recognized as a landmark. It previously returned no
  landmark, which left the words in `unmatched`.

### Fixed

- A bare `mohalla`, `muhalla`, `mahalla`, `moza`, `mauza`, `village`, `goth` or
  `basti` no longer lingers in `unmatched` once the gazetteer has already
  resolved the area: `mohalla islampura sialkot` → `area: 'Islampura'`,
  `unmatched: []`. Where no area resolved the label is kept, so
  `goth allah dino, thatta` still gives `area: 'Goth Allah Dino'`.
- Landmark prepositions are matched longest-first, so `near by masjid` gives
  `Near masjid` instead of `Near by masjid`.

## [0.0.3] — 2026-09-10

### Changed

- Dropped the `prepare` lifecycle script from `package.json`. The Husky Git hook
  is now installed with `npm run hooks:install` (contributors only). Consumers
  installing the package no longer see any install/lifecycle script.

## [0.0.2] — 2026-09-10

First release published to npm.

### Added

- `parseAddress({ address, defaultCity?, defaultProvince?, strict? })` — parses
  messy Pakistani addresses into a structured `ParsedAddress` (`house`, `street`,
  `block`, `sector`, `phase`, `unit`, `landmark`, `area`, `city`, `province`,
  `country`, `raw`, `unmatched`, `confidence`).
- `normalizeAddress({ address, ... })` — canonical single-line address string.
- Geo helpers: `getProvince({ city })`, `getCity({ province, city })`,
  `listProvinces()`, `listCities({ province? })`, `listAreas({ city })`,
  `isProvince({ name })`, `isCity({ name })`, backed by a bundled Pakistan
  gazetteer (7 provinces, ~204 cities, ~3,230 localities) built from GeoNames +
  curated overrides.
- Dual ESM + CommonJS builds with `.d.ts` / `.d.cts` declarations; zero runtime
  dependencies; usable from TypeScript, plain-JS ESM, and plain-JS CommonJS with
  no build step.
- `examples/` folder, a ~70-address real-world test fixture, and a full test
  suite (158 tests).
- Prettier + ESLint + a Husky `pre-commit` hook (lint-staged).

### Changed

- All public types and interfaces live in dedicated `src/types/` and
  `src/interfaces/` folders — none declared in-file.
- `unit` now retains its label, title-cased (`"Flat 3"`, `"Apartment 12-C"`)
  rather than returning the bare value.
- Sector and block designators are upper-cased (`"F-8/3"`, `"G-9"`, `"B"`).
- A bare multi-city society name with no city token (e.g. `"DHA"`) no longer
  guesses a city/province; `confidence` reflects the missing geo.
- A guessed (non-gazetteer) `area` now lowers `confidence`, so unrecognized
  input scores lower.

### Removed

- Source maps are no longer shipped in the npm tarball.

## [0.0.1] — 2026-09-09

- Internal pre-release. Never published to npm.
