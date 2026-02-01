import { describe, it, expect } from 'vitest';
import { filterData } from './filtering';
import { ColumnDef } from '../types/dataTable.types';

interface TestData {
  id: number;
  name: string | null;
  email: string;
  age: number | null;
}

describe('filterData', () => {
  const mockColumns: ColumnDef<TestData>[] = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'age', header: 'Age' }
  ];

  const mockData: TestData[] = [
    { id: 1, name: 'Alice Johnson', email: 'alice@test.com', age: 30 },
    { id: 2, name: 'Bob Smith', email: 'bob@test.com', age: 25 },
    { id: 3, name: 'Charlie Brown', email: 'charlie@test.com', age: 35 },
    { id: 4, name: null, email: 'null@test.com', age: null },
    { id: 5, name: 'David', email: 'david@example.org', age: 40 },
  ];

  describe('basic filtering', () => {
    it('returns all data when filterText is empty', () => {
      const result = filterData(mockData, mockColumns, '');
      expect(result).toEqual(mockData);
    });

    it('returns all data when filterText is whitespace-only', () => {
      const result = filterData(mockData, mockColumns, '   ');
      expect(result).toEqual(mockData);
    });

    it('filters case-insensitively', () => {
      const result = filterData(mockData, mockColumns, 'ALICE');
      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('Alice Johnson');
    });

    it('filters with partial matches', () => {
      const result = filterData(mockData, mockColumns, 'test');
      expect(result).toHaveLength(4);
      expect(result.map(r => r.email)).toEqual([
        'alice@test.com',
        'bob@test.com',
        'charlie@test.com',
        'null@test.com'
      ]);
    });

    it('trims whitespace from search term', () => {
      const result = filterData(mockData, mockColumns, '  alice  ');
      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('Alice Johnson');
    });
  });

  describe('multi-column search', () => {
    it('matches rows where ANY column contains search term', () => {
      const result = filterData(mockData, mockColumns, 'example');
      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('David');
    });

    it('returns row if at least one column matches', () => {
      const result = filterData(mockData, mockColumns, '25');
      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('Bob Smith');
    });

    it('searches across name and email columns', () => {
      const result = filterData(mockData, mockColumns, 'smith');
      expect(result).toHaveLength(1);
      expect(result[0]?.email).toBe('bob@test.com');
    });
  });

  describe('null/undefined handling', () => {
    it('excludes null values from matching', () => {
      const result = filterData(mockData, mockColumns, 'null');
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe(4); // Only matches email, not name
    });

    it('does not crash on null values', () => {
      expect(() => {
        filterData(mockData, mockColumns, 'something');
      }).not.toThrow();
    });

    it('handles rows with multiple null values', () => {
      const result = filterData(mockData, mockColumns, 'null@test.com');
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe(4);
    });
  });

  describe('edge cases', () => {
    it('handles empty data array', () => {
      const result = filterData([], mockColumns, 'test');
      expect(result).toEqual([]);
    });

    it('returns empty array when no matches', () => {
      const result = filterData(mockData, mockColumns, 'nonexistent');
      expect(result).toEqual([]);
    });

    it('handles special characters in search term', () => {
      const specialData: TestData[] = [
        { id: 1, name: 'Test@User', email: 'test@user.com', age: 25 },
        { id: 2, name: 'Normal User', email: 'normal@user.com', age: 30 }
      ];
      const result = filterData(specialData, mockColumns, '@');
      expect(result).toHaveLength(2); // Both have @ in email
    });

    it('handles numbers in search term', () => {
      const result = filterData(mockData, mockColumns, '40');
      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('David');
    });

    it('handles search term with dots', () => {
      const result = filterData(mockData, mockColumns, 'test.com');
      expect(result).toHaveLength(4);
    });
  });

  describe('data immutability', () => {
    it('does not mutate original data array', () => {
      const originalData = [...mockData];
      filterData(mockData, mockColumns, 'alice');
      expect(mockData).toEqual(originalData);
    });
  });
});
