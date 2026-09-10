# Examples

Run against the built package (`npm run build` first), or run all at once:

```bash
npm run examples
```

| File                      | Shows                                                                                        |
| ------------------------- | -------------------------------------------------------------------------------------------- |
| `01-parse-address.ts`     | `parseAddress({ address })` on the three canonical inputs                                    |
| `02-normalize-address.ts` | `normalizeAddress({ address })` before/after pairs                                           |
| `03-geo-helpers.ts`       | `getProvince`, `getCity`, `listProvinces`, `listCities`, `listAreas`, `isProvince`, `isCity` |
| `04-batch-cleanup.ts`     | batch cleanup of dirty addresses to structured rows                                          |
| `05-commonjs.cjs`         | the same basics via `require("../dist/index.cjs")` — proves the CommonJS build               |
| `06-esm.mjs`              | the same basics via `import` in plain JS — proves the ESM build                              |

The three consumption modes are all exercised: TypeScript (`01-04` via `tsx`),
plain-JS CommonJS (`05` via `node`), and plain-JS ESM (`06` via `node`).

Run one directly:

```bash
npx tsx examples/01-parse-address.ts
node examples/05-commonjs.cjs
node examples/06-esm.mjs
```
