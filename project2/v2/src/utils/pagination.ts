/**
 * Calculate the total number of pages based on row count and page size
 * @param totalRows - Total number of rows
 * @param pageSize - Number of rows per page
 * @returns Total number of pages (minimum 1)
 */
export function calculateTotalPages(totalRows: number, pageSize: number): number {
  return Math.max(1, Math.ceil(totalRows / pageSize));
}

/**
 * Clamp a page number to a valid range [1, totalPages]
 * @param page - Page number to clamp
 * @param totalPages - Maximum number of pages
 * @returns Clamped page number
 */
export function clampPage(page: number, totalPages: number): number {
  return Math.min(Math.max(1, page), totalPages);
}

/**
 * Extract a single page of data from the full dataset
 * @param data - Full dataset
 * @param currentPage - Current page number (1-indexed)
 * @param pageSize - Number of rows per page
 * @returns Slice of data for the current page
 */
export function paginateData<T>(
  data: T[],
  currentPage: number,
  pageSize: number
): T[] {
  const startIndex = (currentPage - 1) * pageSize;
  return data.slice(startIndex, startIndex + pageSize);
}
