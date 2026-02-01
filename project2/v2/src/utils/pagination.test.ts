import { describe, it, expect } from 'vitest';
import { calculateTotalPages, clampPage, paginateData } from './pagination';

describe('calculateTotalPages', () => {
  describe('exact division', () => {
    it('calculates pages when rows divide evenly', () => {
      expect(calculateTotalPages(15, 5)).toBe(3);
      expect(calculateTotalPages(20, 10)).toBe(2);
      expect(calculateTotalPages(100, 25)).toBe(4);
    });
  });

  describe('partial pages', () => {
    it('rounds up for partial pages', () => {
      expect(calculateTotalPages(17, 5)).toBe(4);
      expect(calculateTotalPages(11, 10)).toBe(2);
      expect(calculateTotalPages(101, 25)).toBe(5);
    });

    it('handles single item overflow', () => {
      expect(calculateTotalPages(21, 20)).toBe(2);
      expect(calculateTotalPages(51, 50)).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('returns minimum of 1 for empty data', () => {
      expect(calculateTotalPages(0, 5)).toBe(1);
      expect(calculateTotalPages(0, 10)).toBe(1);
      expect(calculateTotalPages(0, 100)).toBe(1);
    });

    it('handles single row', () => {
      expect(calculateTotalPages(1, 5)).toBe(1);
      expect(calculateTotalPages(1, 10)).toBe(1);
    });

    it('handles page size of 1', () => {
      expect(calculateTotalPages(5, 1)).toBe(5);
      expect(calculateTotalPages(100, 1)).toBe(100);
    });

    it('handles large datasets', () => {
      expect(calculateTotalPages(1000, 10)).toBe(100);
      expect(calculateTotalPages(9999, 100)).toBe(100);
    });
  });
});

describe('clampPage', () => {
  describe('clamping to minimum', () => {
    it('clamps negative pages to 1', () => {
      expect(clampPage(-5, 10)).toBe(1);
      expect(clampPage(-1, 10)).toBe(1);
      expect(clampPage(-100, 10)).toBe(1);
    });

    it('clamps zero to 1', () => {
      expect(clampPage(0, 10)).toBe(1);
      expect(clampPage(0, 5)).toBe(1);
    });
  });

  describe('clamping to maximum', () => {
    it('clamps above max to max', () => {
      expect(clampPage(15, 10)).toBe(10);
      expect(clampPage(100, 50)).toBe(50);
      expect(clampPage(6, 5)).toBe(5);
    });

    it('handles large overflow', () => {
      expect(clampPage(999, 10)).toBe(10);
      expect(clampPage(1000000, 1)).toBe(1);
    });
  });

  describe('valid pages', () => {
    it('leaves valid pages unchanged', () => {
      expect(clampPage(5, 10)).toBe(5);
      expect(clampPage(1, 10)).toBe(1);
      expect(clampPage(10, 10)).toBe(10);
    });

    it('handles first page', () => {
      expect(clampPage(1, 5)).toBe(1);
      expect(clampPage(1, 1)).toBe(1);
    });

    it('handles last page', () => {
      expect(clampPage(10, 10)).toBe(10);
      expect(clampPage(5, 5)).toBe(5);
    });

    it('handles middle pages', () => {
      expect(clampPage(5, 10)).toBe(5);
      expect(clampPage(50, 100)).toBe(50);
    });
  });

  describe('edge cases', () => {
    it('handles single page total', () => {
      expect(clampPage(1, 1)).toBe(1);
      expect(clampPage(5, 1)).toBe(1);
      expect(clampPage(-5, 1)).toBe(1);
    });

    it('handles boundary values', () => {
      expect(clampPage(0, 1)).toBe(1);
      expect(clampPage(1, 1)).toBe(1);
      expect(clampPage(2, 1)).toBe(1);
    });
  });
});

describe('paginateData', () => {
  const testData = Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`
  }));

  describe('first page', () => {
    it('returns first page correctly', () => {
      const result = paginateData(testData, 1, 10);
      expect(result).toHaveLength(10);
      expect(result[0]?.id).toBe(1);
      expect(result[9]?.id).toBe(10);
    });

    it('handles different page sizes', () => {
      const result5 = paginateData(testData, 1, 5);
      expect(result5).toHaveLength(5);
      expect(result5[0]?.id).toBe(1);
      expect(result5[4]?.id).toBe(5);

      const result20 = paginateData(testData, 1, 20);
      expect(result20).toHaveLength(20);
      expect(result20[0]?.id).toBe(1);
      expect(result20[19]?.id).toBe(20);
    });
  });

  describe('middle pages', () => {
    it('returns middle page correctly', () => {
      const result = paginateData(testData, 2, 10);
      expect(result).toHaveLength(10);
      expect(result[0]?.id).toBe(11);
      expect(result[9]?.id).toBe(20);
    });

    it('calculates correct start index', () => {
      const result = paginateData(testData, 3, 5);
      expect(result).toHaveLength(5);
      expect(result[0]?.id).toBe(11);
      expect(result[4]?.id).toBe(15);
    });
  });

  describe('last page', () => {
    it('returns partial last page', () => {
      const result = paginateData(testData, 3, 10);
      expect(result).toHaveLength(5);
      expect(result[0]?.id).toBe(21);
      expect(result[4]?.id).toBe(25);
    });

    it('handles exact division on last page', () => {
      const result = paginateData(testData, 5, 5);
      expect(result).toHaveLength(5);
      expect(result[0]?.id).toBe(21);
      expect(result[4]?.id).toBe(25);
    });

    it('handles single item on last page', () => {
      const data = Array.from({ length: 21 }, (_, i) => ({ id: i + 1 }));
      const result = paginateData(data, 3, 10);
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe(21);
    });
  });

  describe('out-of-bounds pages', () => {
    it('returns empty array for page beyond data', () => {
      const result = paginateData(testData, 10, 10);
      expect(result).toHaveLength(0);
    });

    it('returns empty array for very large page number', () => {
      const result = paginateData(testData, 999, 10);
      expect(result).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('handles empty data', () => {
      const result = paginateData([], 1, 10);
      expect(result).toEqual([]);
    });

    it('handles page size larger than data', () => {
      const smallData = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = paginateData(smallData, 1, 100);
      expect(result).toHaveLength(3);
      expect(result).toEqual(smallData);
    });

    it('handles page size of 1', () => {
      const result = paginateData(testData, 5, 1);
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe(5);
    });

    it('handles single data item', () => {
      const singleData = [{ id: 1, name: 'Single' }];
      const result = paginateData(singleData, 1, 10);
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe(1);
    });

    it('handles page 0 (invalid but should return empty)', () => {
      const result = paginateData(testData, 0, 10);
      expect(result).toHaveLength(0);
    });

    it('handles negative page (uses negative slice indices)', () => {
      // Note: Negative pages result in negative slice indices
      // slice(-20, -10) on 25-item array returns items 6-15
      const result = paginateData(testData, -1, 10);
      expect(result).toHaveLength(10);
      expect(result[0]?.id).toBe(6);
    });
  });

  describe('data immutability', () => {
    it('does not mutate original data array', () => {
      const originalData = [...testData];
      paginateData(testData, 2, 10);
      expect(testData).toEqual(originalData);
    });

    it('returns a new array slice', () => {
      const result = paginateData(testData, 1, 5);
      expect(result).not.toBe(testData);
      // Verify it's a slice by checking it's a different array
      result.push({ id: 999, name: 'New' });
      expect(testData).toHaveLength(25); // Original unchanged
    });
  });

  describe('comprehensive scenarios', () => {
    it('handles typical pagination flow', () => {
      // Page 1
      let result = paginateData(testData, 1, 5);
      expect(result.map(r => r.id)).toEqual([1, 2, 3, 4, 5]);

      // Page 2
      result = paginateData(testData, 2, 5);
      expect(result.map(r => r.id)).toEqual([6, 7, 8, 9, 10]);

      // Page 3
      result = paginateData(testData, 3, 5);
      expect(result.map(r => r.id)).toEqual([11, 12, 13, 14, 15]);

      // Last page (partial)
      result = paginateData(testData, 5, 5);
      expect(result.map(r => r.id)).toEqual([21, 22, 23, 24, 25]);
    });

    it('handles changing page sizes', () => {
      // Start with 10 per page
      let result = paginateData(testData, 1, 10);
      expect(result).toHaveLength(10);

      // Change to 5 per page
      result = paginateData(testData, 1, 5);
      expect(result).toHaveLength(5);

      // Change to 20 per page
      result = paginateData(testData, 1, 20);
      expect(result).toHaveLength(20);
    });
  });
});
