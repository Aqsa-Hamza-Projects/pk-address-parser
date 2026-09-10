export function normalizePunctuation(raw: string): string {
  if (typeof raw !== 'string') return '';
  return raw
    .normalize('NFKC')
    .replace(/[،٫]/g, ',') // Arabic/Urdu comma + decimal separator
    .replace(/؛/g, ';')
    .replace(/[    ]/g, ' ')
    .replace(/[‒-―−]/g, '-')
    .replace(/[\r\n]+/g, ', ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/(?:,\s*){2,}/g, ', ')
    .replace(/^[\s,]+/, '')
    .replace(/[\s,]+$/, '')
    .trim();
}
