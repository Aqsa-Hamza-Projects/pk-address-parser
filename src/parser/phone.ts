import type {PhoneResult} from '../interfaces/index.js';

// Separators a human puts inside a phone number. `,` is excluded on purpose:
// it delimits address segments, so a number never spans one.
const SEP = '[\\s.()-]*';
const TRUNK = '(?:\\+\\s?92|0092|92|0)';

// A candidate must start at a trunk code, so a stray digit ahead of the number
// ("St 3 0300-1234567") cannot drag the match out of alignment.
const CANDIDATE = new RegExp(
  `(?<![\\d+])\\(?${TRUNK}${SEP}\\d(?:${SEP}\\d){7,11}(?![\\d])`,
  'g'
);

const MOBILE = /^03\d{9}$/;
// `03` is reserved for mobile, so a landline trunk never starts with it.
const LANDLINE = /^0(?!3)\d{8,10}$/;

/** Reduce a matched span to national form, or null if it is not a PK number. */
function toNational(match: string): string | null {
  const digits = match.replace(/\D/g, '');
  let national: string;
  if (digits.startsWith('0092')) national = `0${digits.slice(4)}`;
  else if (digits.startsWith('92')) national = `0${digits.slice(2)}`;
  else if (digits.startsWith('0')) national = digits;
  else return null;
  if (MOBILE.test(national) || LANDLINE.test(national)) return national;
  return null;
}

/**
 * Pull the first Pakistani phone number out of `text`.
 *
 * Runs before every other rule so a pasted number cannot be mistaken for a
 * locality. Later numbers are left in `remainder` rather than dropped.
 */
export function extractPhone(text: string): PhoneResult {
  if (typeof text !== 'string' || text === '') {
    return {phone: null, remainder: ''};
  }
  CANDIDATE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = CANDIDATE.exec(text)) !== null) {
    const national = toNational(m[0]);
    if (national === null) continue;
    const remainder =
      text.slice(0, m.index) +
      ' '.repeat(m[0].length) +
      text.slice(m.index + m[0].length);
    return {phone: national, remainder};
  }
  return {phone: null, remainder: text};
}
