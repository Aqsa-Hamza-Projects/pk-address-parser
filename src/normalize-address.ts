import type {ParseAddressParams} from './interfaces/index.js';
import {parseAddress} from './parser/index.js';
import {normalizeKey} from './geo/store.js';

export function normalizeAddress(params: ParseAddressParams): string {
  const parsed = parseAddress(params);
  const parts: string[] = [];
  if (parsed.house) parts.push(`House ${parsed.house}`);
  if (parsed.street) parts.push(`Street ${parsed.street}`);
  if (parsed.block) parts.push(`Block ${parsed.block}`);
  if (parsed.sector) parts.push(`Sector ${parsed.sector}`);
  if (parsed.phase) parts.push(`Phase ${parsed.phase}`);
  if (parsed.unit) parts.push(parsed.unit);
  if (parsed.chak) parts.push(`Chak ${parsed.chak}`);
  if (parsed.landmark) parts.push(parsed.landmark);
  if (parsed.area) parts.push(parsed.area);

  const dropCity =
    parsed.city &&
    parsed.province &&
    normalizeKey(parsed.province).startsWith(normalizeKey(parsed.city));
  if (parsed.city && !dropCity) parts.push(parsed.city);
  if (parsed.province) parts.push(parsed.province);

  if (parts.length === 0) {
    return String((params as {address?: unknown} | undefined)?.address ?? '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  parts.push('Pakistan');
  return parts.join(', ');
}
