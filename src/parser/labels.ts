/**
 * Roman-Urdu (and English) address labels.
 *
 * These words also occur inside ~370 real locality names in
 * `src/data/areas.json` — `Makan Bagh`, `Sund Gali`, `Ghanta Ghar`,
 * `Goth Juma Khan Narejo`. So none of them may go in
 * `src/data/abbreviations.json`, which rewrites a token wherever it appears
 * with no surrounding context. They are matched only where context proves
 * they are labels: the shapes below, or — for a bare locality label — only
 * once the gazetteer has already resolved the area (`stripLocalityLabels`).
 */

/**
 * Labels the parser already accepted before Roman-Urdu support. Matched
 * anywhere, exactly as they were — this PR must not change their behaviour.
 */
export const HOUSE_LABELS: readonly string[] = [
  'house',
  'hno',
  'h',
  'kothi',
  'plot',
];

export const STREET_LABELS: readonly string[] = ['street', 'st'];

/**
 * Roman-Urdu labels, matched only when NOT preceded by a word.
 *
 * A digit after the label is not enough on its own. Several gazetteer names
 * *end* in one of these words — `Sund Gali`, `Ghanta Ghar`, `Qasim Lane`,
 * `Sonar Galli` — so `Sund Gali 5` would otherwise parse as the area `Sund`
 * plus street `5`, losing half the locality name. In a real address the label
 * opens a segment (`gali 5`, `, ghar no 7`) or follows the previous field's
 * number (`makan 12 gali 5`); it is never preceded by a bare word.
 */
export const HOUSE_LABELS_URDU: readonly string[] = [
  'makan',
  'makaan',
  'ghar',
  'bangla',
  'bunglow',
  'bungalow',
  'villa',
];

export const STREET_LABELS_URDU: readonly string[] = [
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

const NUM = NUMBER_WORDS.join('|');

/**
 * The "not preceded by a word" guard described on `HOUSE_LABELS_URDU`.
 * `\p{L}` rather than `[a-z]`, so an Urdu-script word blocks it too.
 */
const LEADING_GUARD = String.raw`(?<!\p{L}[\s.-])`;

/** Builds the `house` rule body for a set of labels. */
export function houseRuleSource(labels: readonly string[]): string {
  return (
    String.raw`\b(?:` +
    labels.join('|') +
    String.raw`)\b\s*(?:\.?\s*(?:` +
    NUM +
    String.raw`)\.?)?\s*[:#.-]?\s*([0-9]+[a-z]?(?:[/-][0-9a-z]+)*)`
  );
}

/** Builds the `street` rule body for a set of labels. */
export function streetRuleSource(labels: readonly string[]): string {
  return (
    String.raw`\b(?:` +
    labels.join('|') +
    String.raw`)\b\.?\s*(?:(?:` +
    NUM +
    String.raw`)\.?\s*)?[:#.-]?\s*([0-9]+[a-z]?(?:-[0-9a-z]+)?)`
  );
}

/**
 * The four compiled component rules this module owns. Exported so that
 * `components.ts` and the gazetteer corpus test share one definition instead
 * of each hand-copying the pattern — a copy can silently diverge from the
 * rule it claims to pin.
 */
export const HOUSE_RE = new RegExp(houseRuleSource(HOUSE_LABELS), 'iu');
export const STREET_RE = new RegExp(streetRuleSource(STREET_LABELS), 'iu');
export const HOUSE_URDU_RE = new RegExp(
  LEADING_GUARD + houseRuleSource(HOUSE_LABELS_URDU),
  'iu'
);
export const STREET_URDU_RE = new RegExp(
  LEADING_GUARD + streetRuleSource(STREET_LABELS_URDU),
  'iu'
);

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
 *
 * The second guard is deliberately strict, and so this fires only on a clean
 * remainder: `mohalla islampura near masjid sialkot` keeps its `mohalla`,
 * because `near`/`masjid` are also left over. Loosening it would mean
 * discarding a token that might belong to a different phrase. Documented in
 * the README's "Known limitations".
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
