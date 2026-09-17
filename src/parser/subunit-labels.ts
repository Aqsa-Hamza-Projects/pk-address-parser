/**
 * Sub-unit labels the component rules capture into `unit`.
 *
 * Single source of truth: `components.ts` builds its `unit` rule from this,
 * and `assemble.ts` refuses a leftover that looks like one. Keeping two copies
 * let them drift — `office` was a component rule but not a guarded word, so
 * `Flat 3, Office 5, …` became the locality.
 */
export const SUBUNIT_LABELS = [
  'flat',
  'apartment',
  'suite',
  'room',
  'shop',
  'office',
  // Hyderabad's formal sub-division designation (Latifabad Units 1-12).
  // Safe to capture unconditionally: of the 4,281 gazetteer names, none ends
  // in `unit` and none has `unit` followed by a digit — the real records spell
  // the numeral out ("Latifabad Unit Number Four"). See test/a3-corpus.test.ts.
  'unit',
] as const;

/**
 * Labels the area guard also refuses, but which have no capture rule yet.
 *
 * `apt` and `portion` are informal. Neither is a locality name, so neither may
 * reach `area`. (`unit` graduated to SUBUNIT_LABELS in PR-A3.)
 */
export const GUARD_ONLY_SUBUNIT_LABELS = ['apt', 'portion'] as const;
