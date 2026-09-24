export function normalizePunctuation(raw: string): string {
  if (typeof raw !== 'string') return '';
  return (
    raw
      .normalize('NFKC')
      .replace(/[،٫]/g, ',') // Arabic/Urdu comma + decimal separator
      .replace(/؛/g, ';')
      .replace(/[    ]/g, ' ')
      .replace(/[‒-―−]/g, '-')
      .replace(/[\r\n]+/g, ', ')
      // `\v` and `\f` are matched by `\s` but were not collapsed here, so a long
      // run of them survived into the component rules. The chak rule's
      // variable-length lookbehind rescans such a run at every start position,
      // making a hostile 64 KB paste quadratic (~15 s). Collapsing them here
      // keeps the rules linear on any realistic input.
      .replace(/[ \t\v\f]{2,}/g, ' ')
      .replace(/\s*,\s*/g, ', ')
      .replace(/(?:,\s*){2,}/g, ', ')
      .replace(/^[\s,]+/, '')
      .replace(/[\s,]+$/, '')
      .trim()
  );
}
