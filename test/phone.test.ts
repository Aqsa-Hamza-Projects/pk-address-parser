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
