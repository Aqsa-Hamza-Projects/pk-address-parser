import {describe, it, expect} from 'vitest';
import {extractPhone} from '../src/parser/phone.js';

describe('extractPhone — canonical forms', () => {
  const cases: Array<[string, string]> = [
    ['0300-1234567', '03001234567'],
    ['0300 1234567', '03001234567'],
    ['03001234567', '03001234567'],
    ['+92 300 1234567', '03001234567'],
    ['+923001234567', '03001234567'],
    ['0092 300 1234567', '03001234567'],
    ['92 300 1234567', '03001234567'],
    ['042-35678901', '04235678901'],
    ['(021) 34567890', '02134567890'],
    ['+92 51 2345678', '0512345678'],
  ];
  for (const [input, expected] of cases) {
    it(`normalizes ${input}`, () => {
      expect(extractPhone(`House 5, ${input}, Lahore`).phone).toBe(expected);
    });
  }
});

describe('extractPhone — rejections', () => {
  const rejects = [
    'Model Town Lahore 54700',
    'House 5 Street 3 Lahore',
    'CNIC 35202-1234567-1',
    'Sector G-11/2 Islamabad',
    '',
  ];
  for (const input of rejects) {
    it(`finds no phone in "${input}"`, () => {
      expect(extractPhone(input).phone).toBeNull();
    });
  }

  it('is safe on non-string input', () => {
    // @ts-expect-error deliberate bad input
    expect(extractPhone(undefined)).toEqual({phone: null, remainder: ''});
  });
});

describe('extractPhone — remainder', () => {
  it('blanks the matched span and preserves length', () => {
    const input = 'House 5 St 3 G-11/2 Islamabad 0300-1234567';
    const {remainder} = extractPhone(input);
    expect(remainder).toHaveLength(input.length);
    expect(remainder).not.toContain('0300');
    expect(remainder).toContain('G-11/2');
    expect(remainder).toContain('Islamabad');
  });

  it('takes the first number and leaves later ones behind', () => {
    const {phone, remainder} = extractPhone(
      'Lahore 0300-1234567, 0321-9876543'
    );
    expect(phone).toBe('03001234567');
    expect(remainder).toContain('0321-9876543');
  });

  it('returns the text unchanged when there is no phone', () => {
    expect(extractPhone('Johar Town Lahore').remainder).toBe(
      'Johar Town Lahore'
    );
  });
});

describe('extractPhone — contact labels are consumed with the number', () => {
  const labelled = [
    'Cell 0300 1234567',
    'Mob 0300-1234567',
    'Ph: 0300-1234567',
    'Ph# 0300-1234567',
    'Mobile No. 0300-1234567',
    'Contact 0300-1234567',
    'WhatsApp 0300-1234567',
  ];
  for (const input of labelled) {
    it(`consumes the label in "${input}"`, () => {
      const {phone, remainder} = extractPhone(`Lahore, ${input}`);
      expect(phone).toBe('03001234567');
      // The label must be gone, not merely the digits — a surviving label is
      // what the area fallback would promote to the locality.
      expect(remainder).toContain('Lahore');
      expect(remainder.replace('Lahore', '')).not.toMatch(/\p{L}/u);
    });
  }

  it('leaves an unrelated leading word alone', () => {
    const {remainder} = extractPhone('Gulberg 0300-1234567');
    expect(remainder).toContain('Gulberg');
  });
});

describe('extractPhone — UAN numbers', () => {
  const uans: Array<[string, string]> = [
    ['042 111 123 456', '042111123456'],
    ['021-111-222-333', '021111222333'],
    ['+92 51 111 222 333', '051111222333'],
  ];
  for (const [input, expected] of uans) {
    it(`normalizes UAN ${input}`, () => {
      expect(extractPhone(`Shop 4, ${input}, Lahore`).phone).toBe(expected);
    });
  }
});

describe('extractPhone — does not swallow non-phone numbers', () => {
  // A false positive is destructive: the digits are removed from the address.
  const keep: Array<[string, string]> = [
    ['House 92 12345678 Lahore', 'a house number after a bare 92'],
    ['Chak No 92 123456789, Sargodha', 'a chak number after a bare 92'],
    ['Khasra 0123456789, Faisalabad', 'a khasra number (area code 1)'],
    ['Khewat No 0456789012, Lahore', 'a khewat number'],
    ['Invoice 2024-0012345678, Lahore', 'an invoice number (area code 0)'],
    ['Plot 5, 0.123456789, Lahore', 'a decimal'],
  ];
  for (const [input, why] of keep) {
    it(`does not treat ${why} as a phone`, () => {
      expect(extractPhone(input).phone).toBeNull();
    });
  }

  it('still finds a real number in the same sentence', () => {
    expect(extractPhone('Khasra 0123456789, call 0300-1234567').phone).toBe(
      '03001234567'
    );
  });
});
