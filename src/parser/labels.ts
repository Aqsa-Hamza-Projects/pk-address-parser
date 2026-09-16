/**
 * Roman-Urdu (and English) address labels.
 *
 * These words also occur inside ~370 real locality names in
 * `src/data/areas.json` — `Makan Bagh`, `Sund Gali`, `Ghanta Ghar`,
 * `Goth Juma Khan Narejo`. So none of them may go in
 * `src/data/abbreviations.json`, which rewrites a token wherever it appears
 * with no surrounding context. They are matched only where context proves
 * they are labels: a digit follows (the `components.ts` rules), or the
 * gazetteer already resolved the area (`stripLocalityLabels`).
 */

export const HOUSE_LABELS: readonly string[] = [
  'house',
  'hno',
  'h',
  'kothi',
  'plot',
  'makan',
  'ghar',
  'bangla',
  'bunglow',
  'bungalow',
  'villa',
];

export const STREET_LABELS: readonly string[] = [
  'street',
  'st',
  'gali',
  'galli',
  'koocha',
  'kucha',
  'lane',
];

// "makan no 12", "makan number 12", "gali nmbr 5".
export const NUMBER_WORDS: readonly string[] = [
  'no',
  'nos',
  'num',
  'nmbr',
  'number',
];

/**
 * Labels that prefix a locality name. Dropped from `unmatched` only once the
 * gazetteer has resolved the area — see `stripLocalityLabels`.
 *
 * `chowk` is deliberately absent: unlike these, it is a *suffix* of the name
 * (`Pakistan Chowk`, `Shaheed Chowk`), so dropping it destroys the name.
 */
export const LOCALITY_LABELS: readonly string[] = [
  'mohalla',
  'muhalla',
  'mohallah',
  'muhallah',
  'mahalla',
  'mahallah',
  'moza',
  'mauza',
  'village',
  'goth',
  'basti',
];

const LOCALITY_SET = new Set(LOCALITY_LABELS);

/**
 * Remove orphan locality labels from the gazetteer leftover.
 *
 * Two guards, each load-bearing:
 *  - `areaResolved` — with no gazetteer hit, `assemble` promotes the leftover
 *    to `area`, and `Goth Allah Dino` must keep its `Goth`.
 *  - all-labels — `leftover` has lost its token positions, so a label cannot
 *    be proven to belong to the resolved area. Dropping only when nothing
 *    else remains keeps the transform lossless: the alternative output was
 *    `unmatched: ['mohalla']`, pure noise.
 */
export function stripLocalityLabels(
  leftover: string[],
  areaResolved: boolean
): string[] {
  if (!areaResolved) return leftover;
  if (leftover.length === 0) return leftover;
  const allLabels = leftover.every((t) =>
    LOCALITY_SET.has(t.toLowerCase().replace(/[.,]+$/, ''))
  );
  return allLabels ? [] : leftover;
}
