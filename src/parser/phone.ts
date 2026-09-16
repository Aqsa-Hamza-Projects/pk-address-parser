import type {PhoneResult} from '../interfaces/index.js';

// Separators a human puts inside a phone number. `,` is excluded on purpose:
// it delimits address segments, so a number never spans one.
const SEP = '[\\s.()-]*';

// A candidate must start at a trunk code, so a stray digit ahead of the number
// ("St 3 0300-1234567") cannot drag the match out of alignment. A bare `92`
// (no `+`, no `00`) is only plausible for a mobile, so it must be followed by
// the `3` that every PK mobile starts with — otherwise "House 92 12345678"
// would be read as a phone and the house number silently deleted.
const TRUNK = `(?:\\+\\s?92|0092|92(?=${SEP}3)|0)`;

const CANDIDATE = new RegExp(
  `(?<![\\d+])\\(?${TRUNK}${SEP}\\d(?:${SEP}\\d){7,11}(?![\\d])`,
  'g'
);

// A label the number is usually pasted behind. Matched against the text BEFORE
// the number so it is blanked too; otherwise "Mob 0300-1234567" leaves "Mob"
// as a leftover and the area fallback promotes it to the locality.
const LABEL_BEFORE =
  /\b(?:ph|phone|mob|mobile|cell|tel|telephone|contact|whatsapp|uan)\b\.?\s*(?:no\.?)?\s*[:#.-]*\s*$/i;

// A label that means the digits are NOT a phone. Some land-record and
// accounting numbers are shaped exactly like a landline, so the label is the
// only signal; extracting one would delete it from the address.
const NOT_A_PHONE_BEFORE =
  /\b(?:khasra|khewat|khata|survey|account|acc|a\/c|invoice|receipt|order|ref|reference|cnic|nic)\b\.?\s*(?:no\.?)?\s*[:#.-]*\s*$/i;

const MOBILE = /^03\d{9}$/;
// Landline: trunk `0`, then an area code. No PK area code starts with 0 or 1,
// and `03` is reserved for mobile — without that check any 9-11 digit run
// starting with `0` (khasra, khewat, account and invoice numbers all qualify)
// would be swallowed and deleted from the address.
const LANDLINE = /^0[24-9]\d{7,9}$/;
// UAN: trunk `0`, 2-4 digit area code, then the `111` block and six digits.
const UAN = /^0[24-9]\d{0,2}111\d{6}$/;

/** Reduce a matched span to national form, or null if it is not a PK number. */
function toNational(match: string): string | null {
  const digits = match.replace(/\D/g, '');
  let national: string;
  if (digits.startsWith('0092')) national = `0${digits.slice(4)}`;
  else if (digits.startsWith('92')) national = `0${digits.slice(2)}`;
  else if (digits.startsWith('0')) national = digits;
  else return null;
  if (MOBILE.test(national) || LANDLINE.test(national) || UAN.test(national)) {
    return national;
  }
  return null;
}

/**
 * Pull the first Pakistani phone number out of `text`.
 *
 * Runs before every other rule so a pasted number cannot be mistaken for a
 * locality. Later numbers are left in `remainder` rather than dropped.
 *
 * The span is blanked rather than removed so neighbouring tokens cannot fuse
 * ("Islamabad" + "0300…"); nothing downstream depends on absolute offsets.
 */
export function extractPhone(text: string): PhoneResult {
  if (typeof text !== 'string' || text === '') {
    return {phone: null, remainder: ''};
  }
  CANDIDATE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = CANDIDATE.exec(text)) !== null) {
    const national = toNational(m[0]);
    if (national === null) {
      // Resume just past this candidate's start, not past its whole span: a
      // valid shorter number may begin inside a run that failed as a whole.
      CANDIDATE.lastIndex = m.index + 1;
      continue;
    }
    const before = text.slice(0, m.index);
    if (NOT_A_PHONE_BEFORE.test(before)) {
      CANDIDATE.lastIndex = m.index + 1;
      continue;
    }
    const label = LABEL_BEFORE.exec(before);
    const start = label ? m.index - label[0].length : m.index;
    const end = m.index + m[0].length;
    const remainder =
      text.slice(0, start) + ' '.repeat(end - start) + text.slice(end);
    return {phone: national, remainder};
  }
  return {phone: null, remainder: text};
}
