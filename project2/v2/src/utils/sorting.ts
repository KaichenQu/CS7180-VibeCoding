import { BaseRow, SortState } from '../types/dataTable.types';

/**
 * Sort data based on the current sort state
 * Handles numeric, date, and string comparisons, as well as null values
 * @param data - Array of data to sort
 * @param sortState - Current sort state (key and direction)
 * @returns Sorted array of data (new array, original not mutated)
 */
export function sortData<T extends BaseRow>(
  data: T[],
  sortState: SortState<T>
): T[] {
  const { key, direction } = sortState;
  if (!key || !direction) return data;

  return [...data].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    // Handle null/undefined
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return direction === 'asc' ? -1 : 1;
    if (bVal == null) return direction === 'asc' ? 1 : -1;

    // Numeric comparison
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return direction === 'asc' ? aVal - bVal : bVal - aVal;
    }

    // Date comparison (ISO string format)
    const aDate = Date.parse(String(aVal));
    const bDate = Date.parse(String(bVal));
    if (!isNaN(aDate) && !isNaN(bDate)) {
      return direction === 'asc' ? aDate - bDate : bDate - aDate;
    }

    // String comparison (default)
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    const comparison = aStr.localeCompare(bStr);
    return direction === 'asc' ? comparison : -comparison;
  });
}

/**
 * Calculate the next sort state based on the current state and clicked column
 * Implements the cycle: none → asc → desc → none
 * @param currentState - Current sort state
 * @param clickedKey - Column key that was clicked
 * @returns New sort state
 */
export function getNextSortState<T extends BaseRow>(
  currentState: SortState<T>,
  clickedKey: keyof T
): SortState<T> {
  if (currentState.key !== clickedKey) {
    // Different column clicked - start with ascending
    return { key: clickedKey, direction: 'asc' };
  }
  if (currentState.direction === 'asc') {
    // Same column, currently asc - change to desc
    return { key: clickedKey, direction: 'desc' };
  }
  // Same column, currently desc - reset sort
  return { key: null, direction: null };
}
