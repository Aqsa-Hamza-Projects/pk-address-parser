import type {ParsedAddress} from './interfaces/index.js';
import {COUNTRY} from './constants.js';

export function emptyResult(raw: string): ParsedAddress {
  return {
    house: null,
    street: null,
    block: null,
    sector: null,
    phase: null,
    unit: null,
    chak: null,
    landmark: null,
    area: null,
    city: null,
    province: null,
    country: COUNTRY,
    phone: null,
    raw,
    unmatched: [],
    confidence: 0,
  };
}
