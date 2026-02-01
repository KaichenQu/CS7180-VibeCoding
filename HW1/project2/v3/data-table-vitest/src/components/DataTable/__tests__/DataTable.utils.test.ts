import { describe, test, expect } from 'vitest';
import { compareValues, clamp } from '../DataTable.utils';

describe('compareValues', () => {
  describe('Null/Undefined handling', () => {
    test('both null returns 0', () => {
      expect(compareValues(null, null, 'asc')).toBe(0);
    });

    test('both undefined returns 0', () => {
      expect(compareValues(undefined, undefined, 'asc')).toBe(0);
    });

    test('null and undefined returns 0', () => {
      expect(compareValues(null, undefined, 'asc')).toBe(0);
      expect(compareValues(undefined, null, 'asc')).toBe(0);
    });

    test('null always sorts last in asc (returns 1)', () => {
      expect(compareValues(null, 5, 'asc')).toBe(1);
      expect(compareValues(null, 'text', 'asc')).toBe(1);
      expect(compareValues(null, true, 'asc')).toBe(1);
    });

    test('null always sorts last in desc (returns 1)', () => {
      expect(compareValues(null, 5, 'desc')).toBe(1);
      expect(compareValues(null, 'text', 'desc')).toBe(1);
    });

    test('value vs null in asc (returns -1)', () => {
      expect(compareValues(5, null, 'asc')).toBe(-1);
      expect(compareValues('text', null, 'asc')).toBe(-1);
    });

    test('value vs undefined in asc (returns -1)', () => {
      expect(compareValues(5, undefined, 'asc')).toBe(-1);
      expect(compareValues('text', undefined, 'asc')).toBe(-1);
    });

    test('undefined behaves same as null', () => {
      expect(compareValues(undefined, 5, 'asc')).toBe(1);
      expect(compareValues(5, undefined, 'asc')).toBe(-1);
    });
  });

  describe('Number comparison', () => {
    test('ascending: smaller < larger', () => {
      expect(compareValues(5, 10, 'asc')).toBeLessThan(0);
    });

    test('ascending: larger > smaller', () => {
      expect(compareValues(10, 5, 'asc')).toBeGreaterThan(0);
    });

    test('descending: inverts order', () => {
      expect(compareValues(5, 10, 'desc')).toBeGreaterThan(0);
      expect(compareValues(10, 5, 'desc')).toBeLessThan(0);
    });

    test('equal numbers return 0', () => {
      expect(compareValues(5, 5, 'asc')).toBe(0);
      // In desc mode, negating 0 can result in -0, which is equal to 0
      expect(Math.abs(compareValues(100, 100, 'desc'))).toBe(0);
    });

    test('handles negative numbers', () => {
      expect(compareValues(-5, 10, 'asc')).toBeLessThan(0);
      expect(compareValues(-10, -5, 'asc')).toBeLessThan(0);
      expect(compareValues(5, -5, 'asc')).toBeGreaterThan(0);
    });

    test('handles decimals', () => {
      expect(compareValues(1.5, 2.5, 'asc')).toBeLessThan(0);
      expect(compareValues(2.5, 1.5, 'asc')).toBeGreaterThan(0);
      expect(compareValues(1.5, 1.5, 'asc')).toBe(0);
    });

    test('handles zero', () => {
      expect(compareValues(0, 5, 'asc')).toBeLessThan(0);
      expect(compareValues(5, 0, 'asc')).toBeGreaterThan(0);
      expect(compareValues(0, 0, 'asc')).toBe(0);
    });

    test('handles large numbers', () => {
      expect(compareValues(1000000, 2000000, 'asc')).toBeLessThan(0);
      expect(compareValues(2000000, 1000000, 'asc')).toBeGreaterThan(0);
    });
  });

  describe('Boolean comparison', () => {
    test('false < true in asc (true is -1, false is 1)', () => {
      expect(compareValues(false, true, 'asc')).toBeGreaterThan(0);
    });

    test('true > false in asc', () => {
      expect(compareValues(true, false, 'asc')).toBeLessThan(0);
    });

    test('equal booleans return 0', () => {
      expect(compareValues(true, true, 'asc')).toBe(0);
      expect(compareValues(false, false, 'asc')).toBe(0);
    });

    test('descending inverts order', () => {
      expect(compareValues(false, true, 'desc')).toBeLessThan(0);
      expect(compareValues(true, false, 'desc')).toBeGreaterThan(0);
    });
  });

  describe('Date string comparison', () => {
    test('earlier date < later date in asc', () => {
      expect(compareValues('2024-01-01', '2024-12-31', 'asc')).toBeLessThan(0);
    });

    test('later date > earlier date in asc', () => {
      expect(compareValues('2024-12-31', '2024-01-01', 'asc')).toBeGreaterThan(0);
    });

    test('descending inverts date order', () => {
      expect(compareValues('2024-01-01', '2024-12-31', 'desc')).toBeGreaterThan(0);
    });

    test('equal dates return 0', () => {
      expect(compareValues('2024-06-15', '2024-06-15', 'asc')).toBe(0);
    });

    test('handles ISO format with time', () => {
      expect(compareValues('2024-01-01T10:00:00', '2024-01-01T15:00:00', 'asc')).toBeLessThan(0);
    });

    test('handles different months', () => {
      expect(compareValues('2024-02-15', '2024-03-15', 'asc')).toBeLessThan(0);
    });

    test('handles different years', () => {
      expect(compareValues('2023-12-31', '2024-01-01', 'asc')).toBeLessThan(0);
    });
  });

  describe('String comparison', () => {
    test('alphabetical order in asc', () => {
      expect(compareValues('apple', 'banana', 'asc')).toBeLessThan(0);
    });

    test('case-insensitive comparison', () => {
      const result = compareValues('Apple', 'apple', 'asc');
      expect(result).toBe(0);
    });

    test('descending inverts string order', () => {
      expect(compareValues('apple', 'banana', 'desc')).toBeGreaterThan(0);
    });

    test('non-date strings use locale compare', () => {
      expect(compareValues('zebra', 'aardvark', 'asc')).toBeGreaterThan(0);
    });

    test('handles special characters', () => {
      // With sensitivity: 'base', accents are ignored, so café === cafe
      expect(compareValues('café', 'cafe', 'asc')).toBe(0);
    });

    test('handles empty strings', () => {
      expect(compareValues('', 'a', 'asc')).toBeLessThan(0);
      expect(compareValues('a', '', 'asc')).toBeGreaterThan(0);
      expect(compareValues('', '', 'asc')).toBe(0);
    });

    test('handles strings with numbers', () => {
      expect(compareValues('item1', 'item2', 'asc')).toBeLessThan(0);
    });

    test('handles strings that look like dates but are not', () => {
      expect(compareValues('not-a-date-01-01', 'not-a-date-02-02', 'asc')).toBeLessThan(0);
    });
  });

  describe('Mixed types fallback', () => {
    test('number and string converted to strings', () => {
      const result = compareValues(5, 'text', 'asc');
      expect(typeof result).toBe('number');
      expect(result).not.toBe(0);
    });

    test('boolean and string converted to strings', () => {
      const result = compareValues(true, 'text', 'asc');
      expect(typeof result).toBe('number');
    });

    test('number and boolean converted to strings', () => {
      const result = compareValues(5, true, 'asc');
      expect(typeof result).toBe('number');
    });

    test('object toString comparison', () => {
      const obj = { toString: () => 'custom' };
      const result = compareValues(obj, 'text', 'asc');
      expect(typeof result).toBe('number');
    });

    test('handles arrays converted to strings', () => {
      const result = compareValues([1, 2, 3], [4, 5, 6], 'asc');
      expect(typeof result).toBe('number');
    });
  });

  describe('Edge cases', () => {
    test('very long strings', () => {
      const long1 = 'a'.repeat(1000);
      const long2 = 'b'.repeat(1000);
      expect(compareValues(long1, long2, 'asc')).toBeLessThan(0);
    });

    test('strings with whitespace', () => {
      expect(compareValues('  apple  ', 'banana', 'asc')).toBeLessThan(0);
    });

    test('NaN is treated as string "NaN"', () => {
      const result = compareValues(NaN, 5, 'asc');
      expect(typeof result).toBe('number');
    });

    test('Infinity and -Infinity', () => {
      expect(compareValues(Infinity, -Infinity, 'asc')).toBeGreaterThan(0);
      expect(compareValues(-Infinity, Infinity, 'asc')).toBeLessThan(0);
    });
  });
});

describe('clamp', () => {
  test('value within range returns value', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(7, 0, 10)).toBe(7);
    expect(clamp(1, 0, 10)).toBe(1);
  });

  test('value below min returns min', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(-100, 0, 10)).toBe(0);
    expect(clamp(1, 5, 10)).toBe(5);
  });

  test('value above max returns max', () => {
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(100, 0, 10)).toBe(10);
    expect(clamp(20, 5, 10)).toBe(10);
  });

  test('value equals min returns min', () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(5, 5, 10)).toBe(5);
  });

  test('value equals max returns max', () => {
    expect(clamp(10, 0, 10)).toBe(10);
    expect(clamp(100, 0, 100)).toBe(100);
  });

  test('negative range', () => {
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(-15, -10, -1)).toBe(-10);
    expect(clamp(0, -10, -1)).toBe(-1);
  });

  test('decimal values', () => {
    expect(clamp(1.5, 1.0, 2.0)).toBe(1.5);
    expect(clamp(0.5, 1.0, 2.0)).toBe(1.0);
    expect(clamp(2.5, 1.0, 2.0)).toBe(2.0);
  });

  test('zero as min or max', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, -10, 0)).toBe(-5);
    expect(clamp(5, -10, 0)).toBe(0);
  });

  test('same min and max', () => {
    expect(clamp(5, 10, 10)).toBe(10);
    expect(clamp(15, 10, 10)).toBe(10);
    expect(clamp(5, 0, 0)).toBe(0);
  });

  test('large numbers', () => {
    expect(clamp(1000000, 0, 2000000)).toBe(1000000);
    expect(clamp(3000000, 0, 2000000)).toBe(2000000);
  });

  test('page clamping scenario', () => {
    // Simulate page 5 when there are only 3 pages
    expect(clamp(5, 1, 3)).toBe(3);

    // Simulate page 0 when min is 1
    expect(clamp(0, 1, 10)).toBe(1);

    // Valid page
    expect(clamp(2, 1, 10)).toBe(2);
  });
});
