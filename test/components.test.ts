import {describe, it, expect} from 'vitest';
import {extractComponents} from '../src/parser/components.js';

const val = (t: string, f: string) =>
  extractComponents(t).matches.find((m) => m.field === f)?.value ?? null;

describe('extractComponents', () => {
  it('house: labeled, hashed, and dotted forms', () => {
    expect(val('House 23, Lahore', 'house')).toBe('23');
    expect(val('H#23 Lahore', 'house')).toBe('23');
    expect(val('h. no. 23-A Lahore', 'house')).toBe('23-A');
    expect(val('Plot 5/B Karachi', 'house')).toBe('5/B');
  });
  it('bare hash number is treated as house', () => {
    expect(val('#7, Street 2, Lahore', 'house')).toBe('7');
  });
  it('street: labeled forms', () => {
    expect(val('Street 4, Lahore', 'street')).toBe('4');
    expect(val('street no 12, Lahore', 'street')).toBe('12');
    expect(val('St 4-A, Lahore', 'street')).toBe('4-A');
  });
  it('block: letter and number', () => {
    expect(val('Block B, Johar Town', 'block')).toBe('B');
    expect(val('Block 12-C, Gulberg', 'block')).toBe('12-C');
  });
  it('sector: labeled and bare', () => {
    expect(val('Sector F-7/2, Islamabad', 'sector')).toBe('F-7/2');
    expect(val('F-8/3 Islamabad', 'sector')).toBe('F-8/3');
    expect(val('G-9 Islamabad', 'sector')).toBe('G-9');
  });
  it('labeled Block/Flat beat the bare-sector pattern', () => {
    expect(val('Block A-1, Gulshan, Karachi', 'block')).toBe('A-1');
    expect(val('Block A-1, Gulshan, Karachi', 'sector')).toBeNull();
    expect(val('House 4, Block C-1, Model Town', 'block')).toBe('C-1');
    expect(val('Flat A-2, Block 13-D', 'unit')).toBe('Flat A-2');
  });
  it('bare sector still resolves when unlabeled', () => {
    expect(val('F-8/3 Islamabad', 'sector')).toBe('F-8/3');
    expect(val('G-9 Islamabad', 'sector')).toBe('G-9');
  });
  it('uppercases sector and block designators from lowercase input', () => {
    expect(val('f-8/3 islamabad', 'sector')).toBe('F-8/3');
    expect(val('sector g-9, islamabad', 'sector')).toBe('G-9');
    expect(val('block b, johar town', 'block')).toBe('B');
  });
  it('phase: digits and roman numerals', () => {
    expect(val('DHA Phase 6 Lahore', 'phase')).toBe('6');
    expect(val('Phase II, DHA Karachi', 'phase')).toBe('2');
  });
  it('unit: keeps its label, title-cased', () => {
    expect(val('Flat 3, Gulberg', 'unit')).toBe('Flat 3');
    expect(val('flat 3, gulberg', 'unit')).toBe('Flat 3');
    expect(val('Apartment 12-C, Clifton', 'unit')).toBe('Apartment 12-C');
    expect(val('Shop 4, Cantt', 'unit')).toBe('Shop 4');
    expect(val('Suite 5, Blue Area', 'unit')).toBe('Suite 5');
    expect(val('office 12, Blue Area', 'unit')).toBe('Office 12');
    expect(val('2nd Floor, Blue Area', 'unit')).toBe('2nd Floor');
    expect(val('2nd floor, Blue Area', 'unit')).toBe('2nd Floor');
  });
  it('remainder has matched spans blanked and geo tokens intact', () => {
    const r = extractComponents(
      'House 23, Street 4, Block B, Johar Town, Lahore'
    );
    expect(r.remainder).toContain('Johar Town');
    expect(r.remainder).toContain('Lahore');
    expect(r.remainder).not.toMatch(/House 23/);
    expect(r.remainder).not.toMatch(/Street 4/);
  });
  it('first match per field wins', () => {
    const r = extractComponents('Street 4, Street 9, Lahore');
    expect(r.matches.filter((m) => m.field === 'street')).toHaveLength(1);
    expect(r.matches[0]?.value).toBe('4');
  });
  it('no components → empty matches, remainder unchanged-ish', () => {
    const r = extractComponents('Johar Town, Lahore');
    expect(r.matches).toEqual([]);
  });
});
