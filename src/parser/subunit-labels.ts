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
] as const;

/**
 * Labels the area guard also refuses, but which have no capture rule yet.
 *
 * `unit` is Hyderabad's sub-division designation (a `unit` rule for it belongs
 * with the other Hyderabad work); `apt` and `portion` are informal. None of
 * them is a locality name, so none may reach `area`.
 */
export const GUARD_ONLY_SUBUNIT_LABELS = ['unit', 'apt', 'portion'] as const;
