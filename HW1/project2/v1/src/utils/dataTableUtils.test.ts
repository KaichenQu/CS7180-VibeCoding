import { describe, it, expect } from 'vitest';
import {
  filterData,
  sortData,
  paginateData,
  calculateTotalPages,
  getSortIndicator,
  getNextSortState,
} from './dataTableUtils';
import { Person } from '../types/Person';

const mockData: Person[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', department: 'Engineering', role: 'Developer', salary: 95000, startDate: '2020-03-15' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', department: 'Marketing', role: 'Manager', salary: 78000, startDate: '2019-07-22' },
  { id: 3, name: 'Carol Williams', email: 'carol@example.com', department: 'Engineering', role: 'Tech Lead', salary: 115000, startDate: '2018-01-10' },
  { id: 4, name: 'David Brown', email: 'david@example.com', department: 'Sales', role: 'Representative', salary: 62000, startDate: '2021-05-03' },
  { id: 5, name: 'Eva Martinez', email: 'eva@example.com', department: 'HR', role: 'Specialist', salary: 58000, startDate: '2020-11-18' },
];

describe('dataTableUtils', () => {
  describe('filterData', () => {
    it('should return all data when filter is empty', () => {
      const result = filterData(mockData, '');
      expect(result).toEqual(mockData);
      expect(result.length).toBe(5);
    });

    it('should filter by name', () => {
      const result = filterData(mockData, 'Alice');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice Johnson');
    });

    it('should filter by email', () => {
      const result = filterData(mockData, 'bob@example.com');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bob Smith');
    });

    it('should filter by department', () => {
      const result = filterData(mockData, 'Engineering');
      expect(result).toHaveLength(2);
      expect(result.map(p => p.name)).toContain('Alice Johnson');
      expect(result.map(p => p.name)).toContain('Carol Williams');
    });

    it('should filter by role', () => {
      const result = filterData(mockData, 'Manager');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bob Smith');
    });

    it('should filter by salary', () => {
      const result = filterData(mockData, '95000');
      expect(result).toHaveLength(1);
      expect(result[0].salary).toBe(95000);
    });

    it('should filter by start date', () => {
      const result = filterData(mockData, '2020-03-15');
      expect(result).toHaveLength(1);
      expect(result[0].startDate).toBe('2020-03-15');
    });

    it('should be case insensitive', () => {
      const result = filterData(mockData, 'ALICE');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice Johnson');
    });

    it('should return empty array for non-matching filter', () => {
      const result = filterData(mockData, 'NonExistent123');
      expect(result).toHaveLength(0);
    });

    it('should filter by partial match', () => {
      const result = filterData(mockData, 'John');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice Johnson');
    });

    it('should match across multiple fields', () => {
      const result = filterData(mockData, '@example.com');
      expect(result).toHaveLength(5);
    });
  });

  describe('sortData', () => {
    it('should return original data when sortKey is null', () => {
      const result = sortData(mockData, null, 'asc');
      expect(result).toEqual(mockData);
    });

    it('should return original data when sortDirection is null', () => {
      const result = sortData(mockData, 'name', null);
      expect(result).toEqual(mockData);
    });

    it('should sort by name ascending', () => {
      const result = sortData(mockData, 'name', 'asc');
      expect(result[0].name).toBe('Alice Johnson');
      expect(result[4].name).toBe('Eva Martinez');
    });

    it('should sort by name descending', () => {
      const result = sortData(mockData, 'name', 'desc');
      expect(result[0].name).toBe('Eva Martinez');
      expect(result[4].name).toBe('Alice Johnson');
    });

    it('should sort by salary (numeric) ascending', () => {
      const result = sortData(mockData, 'salary', 'asc');
      expect(result[0].salary).toBe(58000);
      expect(result[4].salary).toBe(115000);
    });

    it('should sort by salary (numeric) descending', () => {
      const result = sortData(mockData, 'salary', 'desc');
      expect(result[0].salary).toBe(115000);
      expect(result[4].salary).toBe(58000);
    });

    it('should sort by department alphabetically', () => {
      const result = sortData(mockData, 'department', 'asc');
      expect(result[0].department).toBe('Engineering');
      expect(result[4].department).toBe('Sales');
    });

    it('should sort by start date ascending', () => {
      const result = sortData(mockData, 'startDate', 'asc');
      expect(result[0].startDate).toBe('2018-01-10');
      expect(result[4].startDate).toBe('2021-05-03');
    });

    it('should not modify original array', () => {
      const original = [...mockData];
      sortData(mockData, 'salary', 'desc');
      expect(mockData).toEqual(original);
    });

    it('should handle sorting with equal values', () => {
      const dataWithDuplicates: Person[] = [
        ...mockData,
        { id: 6, name: 'Alice Anderson', email: 'alice2@example.com', department: 'Engineering', role: 'Developer', salary: 95000, startDate: '2020-03-15' },
      ];
      const result = sortData(dataWithDuplicates, 'salary', 'asc');
      expect(result.filter(p => p.salary === 95000)).toHaveLength(2);
    });
  });

  describe('paginateData', () => {
    it('should return first page correctly', () => {
      const result = paginateData(mockData, 1, 2);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Alice Johnson');
      expect(result[1].name).toBe('Bob Smith');
    });

    it('should return second page correctly', () => {
      const result = paginateData(mockData, 2, 2);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Carol Williams');
      expect(result[1].name).toBe('David Brown');
    });

    it('should return last page with remaining items', () => {
      const result = paginateData(mockData, 3, 2);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Eva Martinez');
    });

    it('should return empty array for page beyond range', () => {
      const result = paginateData(mockData, 10, 2);
      expect(result).toHaveLength(0);
    });

    it('should return all items if rowsPerPage is greater than data length', () => {
      const result = paginateData(mockData, 1, 10);
      expect(result).toHaveLength(5);
      expect(result).toEqual(mockData);
    });

    it('should handle rowsPerPage of 1', () => {
      const result = paginateData(mockData, 3, 1);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Carol Williams');
    });

    it('should not modify original array', () => {
      const original = [...mockData];
      paginateData(mockData, 2, 2);
      expect(mockData).toEqual(original);
    });
  });

  describe('calculateTotalPages', () => {
    it('should calculate correct number of pages', () => {
      expect(calculateTotalPages(15, 5)).toBe(3);
    });

    it('should round up for partial pages', () => {
      expect(calculateTotalPages(16, 5)).toBe(4);
    });

    it('should return 1 for empty data', () => {
      expect(calculateTotalPages(0, 5)).toBe(0);
    });

    it('should return 1 when items equal rows per page', () => {
      expect(calculateTotalPages(10, 10)).toBe(1);
    });

    it('should handle single item', () => {
      expect(calculateTotalPages(1, 5)).toBe(1);
    });

    it('should handle large datasets', () => {
      expect(calculateTotalPages(1000, 25)).toBe(40);
    });
  });

  describe('getSortIndicator', () => {
    it('should return ↕ when column is not sorted', () => {
      const result = getSortIndicator('name', 'email', 'asc');
      expect(result).toBe('↕');
    });

    it('should return ↑ when column is sorted ascending', () => {
      const result = getSortIndicator('name', 'name', 'asc');
      expect(result).toBe('↑');
    });

    it('should return ↓ when column is sorted descending', () => {
      const result = getSortIndicator('name', 'name', 'desc');
      expect(result).toBe('↓');
    });

    it('should return ↕ when sortKey is null', () => {
      const result = getSortIndicator(null, 'name', 'asc');
      expect(result).toBe('↕');
    });

    it('should return ↕ for different columns', () => {
      const result = getSortIndicator('salary', 'name', 'desc');
      expect(result).toBe('↕');
    });
  });

  describe('getNextSortState', () => {
    it('should go from unsorted to asc when clicking new column', () => {
      const result = getNextSortState(null, null, 'name');
      expect(result.sortKey).toBe('name');
      expect(result.sortDirection).toBe('asc');
    });

    it('should go from asc to desc when clicking same column', () => {
      const result = getNextSortState('name', 'asc', 'name');
      expect(result.sortKey).toBe('name');
      expect(result.sortDirection).toBe('desc');
    });

    it('should go from desc to null when clicking same column', () => {
      const result = getNextSortState('name', 'desc', 'name');
      expect(result.sortKey).toBe(null);
      expect(result.sortDirection).toBe(null);
    });

    it('should reset to asc when clicking different column', () => {
      const result = getNextSortState('name', 'desc', 'salary');
      expect(result.sortKey).toBe('salary');
      expect(result.sortDirection).toBe('asc');
    });

    it('should handle switching from one column asc to another', () => {
      const result = getNextSortState('email', 'asc', 'department');
      expect(result.sortKey).toBe('department');
      expect(result.sortDirection).toBe('asc');
    });

    it('should handle null direction properly', () => {
      const result = getNextSortState('name', null, 'salary');
      expect(result.sortKey).toBe('salary');
      expect(result.sortDirection).toBe('asc');
    });
  });
});
