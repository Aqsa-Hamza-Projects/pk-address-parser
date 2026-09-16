# Changelog

All notable changes to **pk-address-parser**.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**How to maintain this file:** on each release, add a new
`## [x.y.z] — YYYY-MM-DD` section on top (matching the `package.json` bump),
grouped into _Added_ / _Changed_ / _Fixed_ / _Removed_.

## [Unreleased]

### Added

- Automated OIDC npm publishing workflow via GitHub Actions (`.github/workflows/publish.yml`).
- `phone` on `ParsedAddress`: Pakistani mobile and landline numbers are extracted
  before parsing and normalized to national digits (`03001234567`). Accepts
  `+92`, `0092` and `92` prefixes with spaces, dots, dashes and parentheses.

### Fixed

- A leftover token run is no longer guessed as `area` unless it reads like a
  place name. A pasted phone number, a bare number, an `Nth Floor` or a `Unit N`
  now goes to `unmatched` instead of becoming the locality.

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
