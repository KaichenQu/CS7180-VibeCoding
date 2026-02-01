import { describe, it, expect } from 'vitest';
import { sortData, getNextSortState } from './sorting';
import { SortState } from '../types/dataTable.types';

interface TestData {
  id: number;
  name: string | null;
  age: number | null;
  score: number;
  date: string;
}

describe('sortData', () => {
  describe('numeric sorting', () => {
    const numericData: TestData[] = [
      { id: 1, name: 'Alice', age: 100, score: 85, date: '2023-01-01' },
      { id: 2, name: 'Bob', age: 50, score: 92, date: '2023-01-02' },
      { id: 3, name: 'Charlie', age: 200, score: 78, date: '2023-01-03' }
    ];

    it('sorts ascending', () => {
      const result = sortData(numericData, { key: 'age', direction: 'asc' });
      expect(result.map(r => r.age)).toEqual([50, 100, 200]);
    });

    it('sorts descending', () => {
      const result = sortData(numericData, { key: 'age', direction: 'desc' });
      expect(result.map(r => r.age)).toEqual([200, 100, 50]);
    });

    it('handles negative numbers', () => {
      const data: TestData[] = [
        { id: 1, name: 'A', age: -10, score: 0, date: '2023-01-01' },
        { id: 2, name: 'B', age: 5, score: 0, date: '2023-01-02' },
        { id: 3, name: 'C', age: -20, score: 0, date: '2023-01-03' }
      ];
      const result = sortData(data, { key: 'age', direction: 'asc' });
      expect(result.map(r => r.age)).toEqual([-20, -10, 5]);
    });

    it('handles decimal numbers', () => {
      const data: TestData[] = [
        { id: 1, name: 'A', age: 1, score: 85.5, date: '2023-01-01' },
        { id: 2, name: 'B', age: 2, score: 92.3, date: '2023-01-02' },
        { id: 3, name: 'C', age: 3, score: 78.9, date: '2023-01-03' }
      ];
      const result = sortData(data, { key: 'score', direction: 'asc' });
      expect(result.map(r => r.score)).toEqual([78.9, 85.5, 92.3]);
    });
  });

  describe('date sorting', () => {
    const dateData: TestData[] = [
      { id: 1, name: 'Alice', age: 30, score: 85, date: '2023-03-15' },
      { id: 2, name: 'Bob', age: 25, score: 92, date: '2023-01-10' },
      { id: 3, name: 'Charlie', age: 35, score: 78, date: '2023-12-25' }
    ];

    it('sorts dates ascending (oldest to newest)', () => {
      const result = sortData(dateData, { key: 'date', direction: 'asc' });
      expect(result.map(r => r.date)).toEqual([
        '2023-01-10',
        '2023-03-15',
        '2023-12-25'
      ]);
    });

    it('sorts dates descending (newest to oldest)', () => {
      const result = sortData(dateData, { key: 'date', direction: 'desc' });
      expect(result.map(r => r.date)).toEqual([
        '2023-12-25',
        '2023-03-15',
        '2023-01-10'
      ]);
    });

    it('handles ISO date strings correctly', () => {
      const data: TestData[] = [
        { id: 1, name: 'A', age: 1, score: 0, date: '2023-01-15T10:30:00Z' },
        { id: 2, name: 'B', age: 2, score: 0, date: '2023-01-15T08:30:00Z' },
        { id: 3, name: 'C', age: 3, score: 0, date: '2023-01-15T12:30:00Z' }
      ];
      const result = sortData(data, { key: 'date', direction: 'asc' });
      expect(result.map(r => r.id)).toEqual([2, 1, 3]);
    });
  });

  describe('string sorting', () => {
    const stringData: TestData[] = [
      { id: 1, name: 'Charlie', age: 30, score: 85, date: '2023-01-01' },
      { id: 2, name: 'alice', age: 25, score: 92, date: '2023-01-02' },
      { id: 3, name: 'Bob', age: 35, score: 78, date: '2023-01-03' }
    ];

    it('sorts alphabetically ascending', () => {
      const result = sortData(stringData, { key: 'name', direction: 'asc' });
      expect(result.map(r => r.name)).toEqual(['alice', 'Bob', 'Charlie']);
    });

    it('sorts alphabetically descending', () => {
      const result = sortData(stringData, { key: 'name', direction: 'desc' });
      expect(result.map(r => r.name)).toEqual(['Charlie', 'Bob', 'alice']);
    });

    it('is case-insensitive', () => {
      const data: TestData[] = [
        { id: 1, name: 'ZEBRA', age: 1, score: 0, date: '2023-01-01' },
        { id: 2, name: 'apple', age: 2, score: 0, date: '2023-01-02' },
        { id: 3, name: 'Banana', age: 3, score: 0, date: '2023-01-03' }
      ];
      const result = sortData(data, { key: 'name', direction: 'asc' });
      expect(result.map(r => r.name)).toEqual(['apple', 'Banana', 'ZEBRA']);
    });

    it('uses locale-aware comparison', () => {
      const data: TestData[] = [
        { id: 1, name: 'Äpfel', age: 1, score: 0, date: '2023-01-01' },
        { id: 2, name: 'Zebra', age: 2, score: 0, date: '2023-01-02' },
        { id: 3, name: 'Banane', age: 3, score: 0, date: '2023-01-03' }
      ];
      const result = sortData(data, { key: 'name', direction: 'asc' });
      // localeCompare should handle special characters properly
      expect(result.map(r => r.name)[0]).toBe('Äpfel');
    });
  });

  describe('null handling', () => {
    const nullData: TestData[] = [
      { id: 1, name: 'Alice', age: 100, score: 85, date: '2023-01-01' },
      { id: 2, name: null, age: null, score: 92, date: '2023-01-02' },
      { id: 3, name: 'Charlie', age: 50, score: 78, date: '2023-01-03' }
    ];

    it('places nulls first in ascending sort', () => {
      const result = sortData(nullData, { key: 'name', direction: 'asc' });
      expect(result[0]?.name).toBeNull();
    });

    it('places nulls last in descending sort', () => {
      const result = sortData(nullData, { key: 'name', direction: 'desc' });
      expect(result[result.length - 1]?.name).toBeNull();
    });

    it('handles both null values as equal', () => {
      const data: TestData[] = [
        { id: 1, name: null, age: null, score: 85, date: '2023-01-01' },
        { id: 2, name: null, age: null, score: 92, date: '2023-01-02' }
      ];
      const result = sortData(data, { key: 'name', direction: 'asc' });
      // Both nulls should maintain their order (stable sort)
      expect(result.map(r => r.id)).toEqual([1, 2]);
    });

    it('handles mixed null and valid values', () => {
      const result = sortData(nullData, { key: 'age', direction: 'asc' });
      expect(result.map(r => r.age)).toEqual([null, 50, 100]);
    });

    it('handles undefined values same as null', () => {
      const data: TestData[] = [
        { id: 1, name: 'Alice', age: 100, score: 85, date: '2023-01-01' },
        { id: 2, name: undefined as unknown as null, age: null, score: 92, date: '2023-01-02' },
        { id: 3, name: 'Charlie', age: 50, score: 78, date: '2023-01-03' }
      ];
      const result = sortData(data, { key: 'name', direction: 'asc' });
      expect(result[0]?.name).toBeUndefined();
    });
  });

  describe('no-sort state', () => {
    const data: TestData[] = [
      { id: 1, name: 'Charlie', age: 30, score: 85, date: '2023-01-01' },
      { id: 2, name: 'Alice', age: 25, score: 92, date: '2023-01-02' },
      { id: 3, name: 'Bob', age: 35, score: 78, date: '2023-01-03' }
    ];

    it('returns data unchanged when key is null', () => {
      const result = sortData(data, { key: null, direction: 'asc' });
      expect(result).toEqual(data);
    });

    it('returns data unchanged when direction is null', () => {
      const result = sortData(data, { key: 'name', direction: null });
      expect(result).toEqual(data);
    });

    it('returns data unchanged when both key and direction are null', () => {
      const result = sortData(data, { key: null, direction: null });
      expect(result).toEqual(data);
    });
  });

  describe('data immutability', () => {
    it('does not mutate original data array', () => {
      const data: TestData[] = [
        { id: 3, name: 'Charlie', age: 30, score: 85, date: '2023-01-01' },
        { id: 1, name: 'Alice', age: 25, score: 92, date: '2023-01-02' },
        { id: 2, name: 'Bob', age: 35, score: 78, date: '2023-01-03' }
      ];
      const originalData = [...data];
      sortData(data, { key: 'name', direction: 'asc' });
      expect(data).toEqual(originalData);
    });
  });
});

describe('getNextSortState', () => {
  it('starts with asc for new column', () => {
    const result = getNextSortState<TestData>({ key: null, direction: null }, 'name');
    expect(result).toEqual({ key: 'name', direction: 'asc' });
  });

  it('switches to different column starts with asc', () => {
    const result = getNextSortState<TestData>({ key: 'name', direction: 'desc' }, 'age');
    expect(result).toEqual({ key: 'age', direction: 'asc' });
  });

  it('cycles through asc → desc → null for same column', () => {
    let state: SortState<TestData> = { key: null, direction: null };

    // Click once: asc
    state = getNextSortState(state, 'name');
    expect(state).toEqual({ key: 'name', direction: 'asc' });

    // Click again: desc
    state = getNextSortState(state, 'name');
    expect(state).toEqual({ key: 'name', direction: 'desc' });

    // Click again: reset
    state = getNextSortState(state, 'name');
    expect(state).toEqual({ key: null, direction: null });
  });

  it('changes to asc when clicking different column from desc', () => {
    const state: SortState<TestData> = { key: 'name', direction: 'desc' };
    const result = getNextSortState(state, 'age');
    expect(result).toEqual({ key: 'age', direction: 'asc' });
  });

  it('resets when clicking same column from desc', () => {
    const state: SortState<TestData> = { key: 'name', direction: 'desc' };
    const result = getNextSortState(state, 'name');
    expect(result).toEqual({ key: null, direction: null });
  });
});
