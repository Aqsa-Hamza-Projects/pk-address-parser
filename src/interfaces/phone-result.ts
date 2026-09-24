export interface PhoneResult {
  /** Canonical national form, digits only (`03001234567`), or null. */
  phone: string | null;
  /** Input with the matched span blanked, so downstream offsets still line up. */
  remainder: string;
}
