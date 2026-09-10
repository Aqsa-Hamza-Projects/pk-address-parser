# Changelog

All notable changes to **pk-address-parser**.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**How to maintain this file:** on each release, add a new
`## [x.y.z] — YYYY-MM-DD` section on top (matching the `package.json` bump),
grouped into _Added_ / _Changed_ / _Fixed_ / _Removed_.

## [0.0.1] — 2026-09-09

### Added

- Initial release.
- `parseAddress({ address, defaultCity?, defaultProvince?, strict? })` — parses
  messy Pakistani addresses into `{ house, street, block, sector, phase, unit,
landmark, area, city, province, country, raw, unmatched, confidence }`.
- `normalizeAddress({ address, ... })` — canonical single-line address string.
- Geo helpers: `getProvince({ city })`, `getCity({ province, city })`,
  `listProvinces()`, `listCities({ province? })`, `listAreas({ city })`,
  `isProvince({ name })`, `isCity({ name })`, backed by a bundled Pakistan
  gazetteer built from GeoNames + curated overrides.
- Dual ESM + CommonJS builds with TypeScript declarations; zero runtime
  dependencies.
- `examples/` folder and a real-world address test fixture.
