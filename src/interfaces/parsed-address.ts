import type {Country} from '../types/index.js';

export interface ParsedAddress {
  house: string | null;
  street: string | null;
  block: string | null;
  sector: string | null;
  phase: string | null;
  unit: string | null;
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
