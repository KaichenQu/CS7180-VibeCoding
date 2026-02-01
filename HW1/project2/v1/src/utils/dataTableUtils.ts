import { Person, SortDirection } from '../types/Person';

/**
 * Filters an array of persons based on a search term
 * @param data Array of Person objects
 * @param filter Search term to filter by
 * @returns Filtered array of Person objects
 */
export function filterData(data: Person[], filter: string): Person[] {
  if (!filter) return data;
  const lowerFilter = filter.toLowerCase();
  return data.filter(person =>
    Object.values(person).some(value =>
      String(value).toLowerCase().includes(lowerFilter)
    )
  );
}

/**
 * Sorts an array of persons by a given key and direction
 * @param data Array of Person objects
 * @param sortKey Key to sort by
 * @param sortDirection Direction to sort (asc or desc)
 * @returns Sorted array of Person objects
 */
export function sortData(
  data: Person[],
  sortKey: keyof Person | null,
  sortDirection: SortDirection
): Person[] {
  if (!sortKey || !sortDirection) return data;

  return [...data].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }

    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();

    if (sortDirection === 'asc') {
      return aStr.localeCompare(bStr);
    }
    return bStr.localeCompare(aStr);
  });
}

/**
 * Paginates an array of data
 * @param data Array to paginate
 * @param currentPage Current page number (1-indexed)
 * @param rowsPerPage Number of rows per page
 * @returns Paginated slice of the array
 */
export function paginateData<T>(
  data: T[],
  currentPage: number,
  rowsPerPage: number
): T[] {
  const start = (currentPage - 1) * rowsPerPage;
  return data.slice(start, start + rowsPerPage);
}

/**
 * Calculates total number of pages
 * @param totalItems Total number of items
 * @param rowsPerPage Number of rows per page
 * @returns Total number of pages
 */
export function calculateTotalPages(totalItems: number, rowsPerPage: number): number {
  return Math.ceil(totalItems / rowsPerPage);
}

/**
 * Gets the sort indicator symbol based on current sort state
 * @param currentSortKey Currently sorted column key
 * @param columnKey Column key to check
 * @param sortDirection Current sort direction
 * @returns Sort indicator symbol
 */
export function getSortIndicator(
  currentSortKey: keyof Person | null,
  columnKey: keyof Person,
  sortDirection: SortDirection
): string {
  if (currentSortKey !== columnKey) return '↕';
  return sortDirection === 'asc' ? '↑' : '↓';
}

/**
 * Determines the next sort state when clicking a column header
 * @param currentSortKey Current sort key
 * @param currentSortDirection Current sort direction
 * @param clickedKey Key that was clicked
 * @returns New sort key and direction
 */
export function getNextSortState(
  currentSortKey: keyof Person | null,
  currentSortDirection: SortDirection,
  clickedKey: keyof Person
): { sortKey: keyof Person | null; sortDirection: SortDirection } {
  if (currentSortKey === clickedKey) {
    if (currentSortDirection === 'asc') {
      return { sortKey: clickedKey, sortDirection: 'desc' };
    } else if (currentSortDirection === 'desc') {
      return { sortKey: null, sortDirection: null };
    }
  }
  return { sortKey: clickedKey, sortDirection: 'asc' };
}
