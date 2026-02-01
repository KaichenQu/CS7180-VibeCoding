import { BaseRow, ColumnDef } from '../types/dataTable.types';

/**
 * Filter data based on a search term across all columns
 * @param data - Array of data to filter
 * @param columns - Column definitions to search within
 * @param filterText - Search term to match against
 * @returns Filtered array of data
 */
export function filterData<T extends BaseRow>(
  data: T[],
  columns: ColumnDef<T>[],
  filterText: string
): T[] {
  if (!filterText.trim()) return data;

  const searchTerm = filterText.toLowerCase().trim();

  return data.filter((row) =>
    columns.some((col) => {
      const value = row[col.key];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(searchTerm);
    })
  );
}
