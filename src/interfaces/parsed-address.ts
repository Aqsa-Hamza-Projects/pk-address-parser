import type {Country} from '../types/index.js';

export interface ParsedAddress {
  house: string | null;
  street: string | null;
  block: string | null;
  sector: string | null;
  phase: string | null;
  unit: string | null;
  /**
   * Punjab canal-colony chak number, e.g. `'123/GB'`, `'45/JB'`, `'7/1-L'`.
   * In rural Punjab this IS the locality, so `area` is normally null when it
   * is set.
   */
  chak: string | null;
  landmark: string | null;
  area: string | null;
  city: string | null;
  province: string | null;
  country: Country;
  phone: string | null;
  raw: string;
  unmatched: string[];
  confidence: number;
}
