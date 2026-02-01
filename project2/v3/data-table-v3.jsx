import React, { useState, useMemo, useCallback, useRef } from 'react';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FAANG-LEVEL DATA TABLE - V3
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * DATA FLOW ORDER:
 * 1. Filter  → Reduces dataset based on search term (case-insensitive, all columns)
 * 2. Sort    → Orders filtered results (stable sort preserves original order for equal items)
 * 3. Paginate → Slices sorted results for current page view
 * 
 * KEY EDGE CASES HANDLED:
 * ├─ Empty dataset: Shows appropriate empty state message
 * ├─ No filter matches: Shows "no results" with option to clear filter
 * ├─ Page overflow: Auto-clamps to last valid page when data shrinks
 * ├─ Stable sort: Equal values maintain their relative order (using index tiebreaker)
 * ├─ Null/undefined: Sorted to end regardless of direction
 * ├─ Mixed types: Numbers compared numerically, dates parsed, rest as strings
 * ├─ Rapid filter changes: Debounce not needed with controlled input + useMemo
 * ├─ Sort state persistence: Changing filter preserves sort; changing page size preserves sort
 * ├─ Boundary buttons: First/Prev disabled on page 1; Next/Last disabled on last page
 * └─ Keyboard navigation: Headers focusable and activatable via Enter/Space
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ════════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════════

/** Base constraint for row data - must have unique identifier */
interface RowData {
  id: string | number;
}

/** Sort direction: null means unsorted */
type SortDirection = 'asc' | 'desc' | null;

/** Sort state with column key and direction */
interface SortState<T> {
  columnKey: keyof T | null;
  direction: SortDirection;
}

/** Column definition - generic over row type T */
interface ColumnDefinition<T extends RowData> {
  /** Key in row data object */
  key: keyof T;
  /** Display header text */
  header: string;
  /** Optional custom cell renderer */
  render?: (value: T[keyof T], row: T, rowIndex: number) => React.ReactNode;
  /** Whether column is sortable (default: true) */
  sortable?: boolean;
  /** Optional width (CSS value) */
  width?: string;
  /** Alignment for cell content */
  align?: 'left' | 'center' | 'right';
}

/** Props for DataTable component */
interface DataTableProps<T extends RowData> {
  /** Array of data rows */
  data: T[];
  /** Column definitions */
  columns: ColumnDefinition<T>[];
  /** Initial page size */
  initialPageSize?: number;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Optional caption for accessibility */
  caption?: string;
  /** Optional CSS class for container */
  className?: string;
}

/** Internal row wrapper for stable sorting */
interface IndexedRow<T> {
  row: T;
  originalIndex: number;
}

// ════════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Compares two values for sorting with type-aware comparison
 * Returns negative if a < b, positive if a > b, 0 if equal
 */
function compareValues(a: unknown, b: unknown, direction: 'asc' | 'desc'): number {
  // Handle null/undefined - always sort to end
  const aIsNullish = a === null || a === undefined;
  const bIsNullish = b === null || b === undefined;
  
  if (aIsNullish && bIsNullish) return 0;
  if (aIsNullish) return 1; // nulls always last
  if (bIsNullish) return -1;

  let comparison = 0;

  // Numeric comparison
  if (typeof a === 'number' && typeof b === 'number') {
    comparison = a - b;
  }
  // Boolean comparison
  else if (typeof a === 'boolean' && typeof b === 'boolean') {
    comparison = (a === b) ? 0 : a ? -1 : 1;
  }
  // Try date parsing for strings that look like dates
  else if (typeof a === 'string' && typeof b === 'string') {
    const dateA = Date.parse(a);
    const dateB = Date.parse(b);
    
    if (!isNaN(dateA) && !isNaN(dateB) && a.match(/^\d{4}-\d{2}-\d{2}/)) {
      comparison = dateA - dateB;
    } else {
      // Default string comparison (locale-aware)
      comparison = a.localeCompare(b, undefined, { sensitivity: 'base' });
    }
  }
  // Fallback: convert to string
  else {
    comparison = String(a).localeCompare(String(b), undefined, { sensitivity: 'base' });
  }

  return direction === 'asc' ? comparison : -comparison;
}

/**
 * Clamps a number between min and max (inclusive)
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ════════════════════════════════════════════════════════════════════════════════
// DATA TABLE COMPONENT
// ════════════════════════════════════════════════════════════════════════════════

function DataTable<T extends RowData>({
  data,
  columns,
  initialPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  caption,
  className = '',
}: DataTableProps<T>): JSX.Element {
  // ─────────────────────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────────────────────
  
  const [filterText, setFilterText] = useState('');
  const [sortState, setSortState] = useState<SortState<T>>({
    columnKey: null,
    direction: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Ref for announcements (screen reader)
  const announcerRef = useRef<HTMLDivElement>(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 1: FILTER
  // ─────────────────────────────────────────────────────────────────────────────
  
  const filteredData = useMemo(() => {
    if (!filterText.trim()) return data;

    const searchTerm = filterText.toLowerCase().trim();
    
    return data.filter((row) =>
      columns.some((col) => {
        const value = row[col.key];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchTerm);
      })
    );
  }, [data, columns, filterText]);

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2: STABLE SORT
  // ─────────────────────────────────────────────────────────────────────────────
  
  const sortedData = useMemo(() => {
    const { columnKey, direction } = sortState;
    
    // No sort applied - return filtered data as-is
    if (!columnKey || !direction) return filteredData;

    // Wrap rows with original index for stable sort
    const indexed: IndexedRow<T>[] = filteredData.map((row, index) => ({
      row,
      originalIndex: index,
    }));

    // Sort with tiebreaker on original index (stable sort)
    indexed.sort((a, b) => {
      const aVal = a.row[columnKey];
      const bVal = b.row[columnKey];
      
      const comparison = compareValues(aVal, bVal, direction);
      
      // Tiebreaker: preserve original order for equal values
      if (comparison === 0) {
        return a.originalIndex - b.originalIndex;
      }
      
      return comparison;
    });

    return indexed.map((item) => item.row);
  }, [filteredData, sortState]);

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 3: PAGINATE
  // ─────────────────────────────────────────────────────────────────────────────
  
  const totalRows = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  
  // Clamp current page to valid range (handles filter reducing results)
  const effectivePage = clamp(currentPage, 1, totalPages);
  
  // Update state if clamping occurred
  if (effectivePage !== currentPage) {
    setCurrentPage(effectivePage);
  }

  const paginatedData = useMemo(() => {
    const startIndex = (effectivePage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, effectivePage, pageSize]);

  // Calculate "Showing X-Y of Z"
  const startItem = totalRows === 0 ? 0 : (effectivePage - 1) * pageSize + 1;
  const endItem = Math.min(effectivePage * pageSize, totalRows);

  // ─────────────────────────────────────────────────────────────────────────────
  // EVENT HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  /** Announce to screen readers */
  const announce = useCallback((message: string) => {
    if (announcerRef.current) {
      announcerRef.current.textContent = message;
    }
  }, []);

  /** Handle column header click - cycle sort: none → asc → desc → none */
  const handleSort = useCallback((columnKey: keyof T) => {
    setSortState((prev) => {
      let newDirection: SortDirection;
      let announcement: string;

      if (prev.columnKey !== columnKey) {
        // New column: start with ascending
        newDirection = 'asc';
        announcement = `Sorted ascending`;
      } else if (prev.direction === null) {
        newDirection = 'asc';
        announcement = `Sorted ascending`;
      } else if (prev.direction === 'asc') {
        newDirection = 'desc';
        announcement = `Sorted descending`;
      } else {
        // Was desc, clear sort
        newDirection = null;
        announcement = `Sort cleared`;
      }

      // Announce after state update
      setTimeout(() => announce(announcement), 0);

      return {
        columnKey: newDirection ? columnKey : null,
        direction: newDirection,
      };
    });
  }, [announce]);

  /** Handle keyboard events on sortable headers */
  const handleHeaderKeyDown = useCallback(
    (e: React.KeyboardEvent, columnKey: keyof T) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSort(columnKey);
      }
    },
    [handleSort]
  );

  /** Handle filter input change */
  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterText(e.target.value);
    setCurrentPage(1); // Reset to page 1 on filter change
  }, []);

  /** Clear filter */
  const handleClearFilter = useCallback(() => {
    setFilterText('');
    setCurrentPage(1);
  }, []);

  /** Handle page size change */
  const handlePageSizeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1); // Reset to page 1 on page size change
  }, []);

  /** Navigate to specific page */
  const goToPage = useCallback((page: number) => {
    setCurrentPage(clamp(page, 1, totalPages));
  }, [totalPages]);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  /** Get sort indicator for column */
  const getSortIndicator = (columnKey: keyof T, isSortable: boolean): React.ReactNode => {
    if (!isSortable) return null;

    const isActive = sortState.columnKey === columnKey;
    const direction = isActive ? sortState.direction : null;

    return (
      <span
        className={`ml-2 inline-flex w-4 justify-center ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
        aria-hidden="true"
      >
        {direction === 'asc' && '↑'}
        {direction === 'desc' && '↓'}
        {direction === null && '—'}
      </span>
    );
  };

  /** Render cell content */
  const renderCell = (row: T, col: ColumnDefinition<T>, rowIndex: number): React.ReactNode => {
    const value = row[col.key];

    if (col.render) {
      return col.render(value, row, rowIndex);
    }

    if (value === null || value === undefined) {
      return <span className="text-gray-400">—</span>;
    }

    return String(value);
  };

  /** Get alignment class */
  const getAlignClass = (align?: 'left' | 'center' | 'right'): string => {
    switch (align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className={`w-full ${className}`}>
      {/* Screen reader announcements (live region) */}
      <div
        ref={announcerRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TOOLBAR: Filter + Results Count */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter Input */}
        <div className="relative">
          <label htmlFor="table-filter" className="sr-only">
            Filter table
          </label>
          <input
            id="table-filter"
            type="text"
            value={filterText}
            onChange={handleFilterChange}
            placeholder="Filter all columns..."
            className="w-full sm:w-80 pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                       placeholder:text-gray-400"
            aria-describedby="filter-description"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {filterText && (
            <button
              onClick={handleClearFilter}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 
                         hover:text-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Clear filter"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <span id="filter-description" className="sr-only">
            Type to filter rows. Matches any column, case-insensitive.
          </span>
        </div>

        {/* Results Summary */}
        <div className="text-sm text-gray-600">
          {totalRows === 0 ? (
            'No results'
          ) : (
            <>
              Showing <span className="font-medium">{startItem}–{endItem}</span> of{' '}
              <span className="font-medium">{totalRows}</span>
              {filterText && (
                <span className="text-gray-500"> (filtered from {data.length})</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TABLE */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200" role="grid">
          {caption && (
            <caption className="sr-only">{caption}</caption>
          )}
          
          <thead className="bg-gray-50">
            <tr role="row">
              {columns.map((col) => {
                const isSortable = col.sortable !== false;
                const isCurrentSort = sortState.columnKey === col.key;
                const ariaSortValue = isCurrentSort
                  ? sortState.direction === 'asc'
                    ? 'ascending'
                    : sortState.direction === 'desc'
                    ? 'descending'
                    : 'none'
                  : undefined;

                return (
                  <th
                    key={String(col.key)}
                    role="columnheader"
                    scope="col"
                    tabIndex={isSortable ? 0 : undefined}
                    onClick={isSortable ? () => handleSort(col.key) : undefined}
                    onKeyDown={isSortable ? (e) => handleHeaderKeyDown(e, col.key) : undefined}
                    aria-sort={isSortable ? ariaSortValue : undefined}
                    className={`px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-600
                                ${getAlignClass(col.align)}
                                ${isSortable ? 'cursor-pointer select-none hover:bg-gray-100 focus:outline-none focus:bg-blue-50 focus:ring-2 focus:ring-inset focus:ring-blue-500' : ''}`}
                    style={{ width: col.width }}
                  >
                    <div className={`flex items-center ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : ''}`}>
                      <span>{col.header}</span>
                      {getSortIndicator(col.key, isSortable)}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 bg-white">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-16 text-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="w-12 h-12 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 20a8 8 0 100-16 8 8 0 000 16z"
                      />
                    </svg>
                    <p className="text-gray-500 font-medium">
                      {filterText ? 'No matching results' : 'No data available'}
                    </p>
                    {filterText && (
                      <button
                        onClick={handleClearFilter}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline 
                                   focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                      >
                        Clear filter
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={row.id}
                  role="row"
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  {columns.map((col) => (
                    <td
                      key={`${row.id}-${String(col.key)}`}
                      role="gridcell"
                      className={`px-4 py-3.5 text-sm text-gray-700 ${getAlignClass(col.align)}`}
                    >
                      {renderCell(row, col, rowIndex)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* PAGINATION CONTROLS */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <nav
        aria-label="Table pagination"
        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        {/* Page Size Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="page-size" className="text-sm text-gray-600">
            Rows per page:
          </label>
          <select
            id="page-size"
            value={pageSize}
            onChange={handlePageSizeChange}
            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Page Navigation */}
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-600 mr-3">
            Page <span className="font-medium">{effectivePage}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
          </span>

          {/* First */}
          <button
            onClick={() => goToPage(1)}
            disabled={effectivePage <= 1}
            aria-label="Go to first page"
            className="p-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100 
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>

          {/* Previous */}
          <button
            onClick={() => goToPage(effectivePage - 1)}
            disabled={effectivePage <= 1}
            aria-label="Go to previous page"
            className="p-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100 
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Next */}
          <button
            onClick={() => goToPage(effectivePage + 1)}
            disabled={effectivePage >= totalPages}
            aria-label="Go to next page"
            className="p-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100 
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Last */}
          <button
            onClick={() => goToPage(totalPages)}
            disabled={effectivePage >= totalPages}
            aria-label="Go to last page"
            className="p-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100 
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </nav>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// EXAMPLE USAGE
// ════════════════════════════════════════════════════════════════════════════════

/** Sample data model */
interface Product extends RowData {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  rating: number;
  lastUpdated: string;
}

/** Sample product dataset */
const sampleProducts: Product[] = [
  { id: 1, name: 'MacBook Pro 16"', category: 'Electronics', price: 2499, stock: 45, rating: 4.8, lastUpdated: '2024-01-15' },
  { id: 2, name: 'iPhone 15 Pro', category: 'Electronics', price: 1199, stock: 120, rating: 4.7, lastUpdated: '2024-01-20' },
  { id: 3, name: 'AirPods Pro', category: 'Electronics', price: 249, stock: 300, rating: 4.6, lastUpdated: '2024-01-18' },
  { id: 4, name: 'Standing Desk', category: 'Furniture', price: 599, stock: 25, rating: 4.5, lastUpdated: '2024-01-10' },
  { id: 5, name: 'Ergonomic Chair', category: 'Furniture', price: 449, stock: 50, rating: 4.4, lastUpdated: '2024-01-12' },
  { id: 6, name: 'Mechanical Keyboard', category: 'Accessories', price: 179, stock: 80, rating: 4.7, lastUpdated: '2024-01-22' },
  { id: 7, name: 'Wireless Mouse', category: 'Accessories', price: 79, stock: 150, rating: 4.3, lastUpdated: '2024-01-19' },
  { id: 8, name: '4K Monitor', category: 'Electronics', price: 699, stock: 35, rating: 4.6, lastUpdated: '2024-01-14' },
  { id: 9, name: 'USB-C Hub', category: 'Accessories', price: 89, stock: 200, rating: 4.2, lastUpdated: '2024-01-21' },
  { id: 10, name: 'Webcam HD', category: 'Electronics', price: 129, stock: 90, rating: 4.1, lastUpdated: '2024-01-17' },
  { id: 11, name: 'Desk Lamp', category: 'Furniture', price: 59, stock: 75, rating: 4.0, lastUpdated: '2024-01-11' },
  { id: 12, name: 'Monitor Arm', category: 'Furniture', price: 119, stock: 60, rating: 4.4, lastUpdated: '2024-01-13' },
  { id: 13, name: 'Cable Management Kit', category: 'Accessories', price: 29, stock: 250, rating: 4.2, lastUpdated: '2024-01-23' },
  { id: 14, name: 'Laptop Stand', category: 'Accessories', price: 49, stock: 110, rating: 4.5, lastUpdated: '2024-01-16' },
  { id: 15, name: 'Noise Canceling Headphones', category: 'Electronics', price: 349, stock: 55, rating: 4.8, lastUpdated: '2024-01-24' },
  { id: 16, name: 'Smart Speaker', category: 'Electronics', price: 99, stock: 180, rating: 4.3, lastUpdated: '2024-01-25' },
  { id: 17, name: 'Wireless Charger', category: 'Accessories', price: 39, stock: 220, rating: 4.1, lastUpdated: '2024-01-26' },
  { id: 18, name: 'Filing Cabinet', category: 'Furniture', price: 199, stock: 30, rating: 3.9, lastUpdated: '2024-01-08' },
  { id: 19, name: 'Bookshelf', category: 'Furniture', price: 149, stock: 40, rating: 4.2, lastUpdated: '2024-01-09' },
  { id: 20, name: 'Tablet Stand', category: 'Accessories', price: 35, stock: 130, rating: 4.0, lastUpdated: '2024-01-27' },
];

/** Column definitions */
const productColumns: ColumnDefinition<Product>[] = [
  {
    key: 'name',
    header: 'Product Name',
    width: '200px',
  },
  {
    key: 'category',
    header: 'Category',
    render: (value) => (
      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full
        ${value === 'Electronics' ? 'bg-blue-100 text-blue-800' :
          value === 'Furniture' ? 'bg-amber-100 text-amber-800' :
          'bg-gray-100 text-gray-800'}`}>
        {String(value)}
      </span>
    ),
  },
  {
    key: 'price',
    header: 'Price',
    align: 'right',
    render: (value) => (
      <span className="font-mono font-medium">${Number(value).toLocaleString()}</span>
    ),
  },
  {
    key: 'stock',
    header: 'Stock',
    align: 'right',
    render: (value) => {
      const stock = Number(value);
      return (
        <span className={stock < 50 ? 'text-red-600 font-medium' : ''}>
          {stock.toLocaleString()}
        </span>
      );
    },
  },
  {
    key: 'rating',
    header: 'Rating',
    align: 'center',
    render: (value) => {
      const rating = Number(value);
      return (
        <div className="flex items-center justify-center gap-1">
          <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="font-medium">{rating.toFixed(1)}</span>
        </div>
      );
    },
  },
  {
    key: 'lastUpdated',
    header: 'Last Updated',
    render: (value) => new Date(String(value)).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
  },
];

/** Main App Component */
export default function App(): JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Product Inventory</h1>
          <p className="text-gray-600 mt-1">V3: FAANG-level implementation with stable sort & full a11y</p>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <DataTable
            data={sampleProducts}
            columns={productColumns}
            initialPageSize={5}
            pageSizeOptions={[5, 10, 20]}
            caption="Product inventory table with sorting, filtering, and pagination"
          />
        </div>

        {/* Manual Test Checklist */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">✅ Manual Test Checklist</h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Sorting Tests */}
            <div>
              <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">S</span>
                Sorting
              </h3>
              <ul className="space-y-1.5 text-sm text-gray-600">
                <li className="flex gap-2"><span className="text-gray-400">□</span> Click header: none → asc (↑ shown)</li>
                <li className="flex gap-2"><span className="text-gray-400">□</span> Click again: asc → desc (↓ shown)</li>
                <li className="flex gap-2"><span className="text-gray-400">□</span> Click again: desc → none (— shown)</li>
                <li className="flex gap-2"><span className="text-gray-400">□</span> Click different column: resets to asc</li>
                <li className="flex gap-2"><span className="text-gray-400">□</span> Stable sort: equal values keep order</li>
                <li className="flex gap-2"><span className="text-gray-400">□</span> Numeric sort: Price sorts numerically</li>
                <li className="flex gap-2"><span className="text-gray-400">□</span> Date sort: Last Updated sorts by date</li>
                <li className="flex gap-2"><span className="text-gray-400">□</span> Keyboard: Tab to header, Enter/Space sorts</li>
              </ul>
            </div>

            {/* Filter Tests */}
            <div>
              <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">F</span>
                Filtering
              </h3>
              <ul className="space-y-1.5 text-sm text-gray-600">
                <li className="flex gap-2"><span className="text-gray-400">□</span> Type "mac": shows MacBook only</li>
                <li className="flex gap-2"><span className="text-gray-400">□</span> Case insensitive: "MAC" same as "mac"</li>
                <li className="flex gap-2"><span className="text-gray-400">□</span> Matches any column: "electronics" works</li>
                <li className="flex gap-2"><span className="text-gray-400">□</span> Filter resets to page 1</li>
                <li className="flex gap-2"><span className="text-gray-400">□</span> "Showing X of Y (filtered from Z)" updates</li>
                <li className="flex gap-2"><span className="text-gray-400">□</span> Clear button (×) clears filter</li>
                <li className="flex gap-2"><span className="text-gray-400">□</span> No matches: empty state with clear link</li>
                <li className="flex gap-2"><span className="text-gray-400">□</span> Sort preserved when filter changes</li>
              </ul>
            </div>

            {/* Pagination Tests */}
            <div>
              <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold">P</span>
                Pagination
              </h3>
              <ul className="space-y-1.5 text-sm text-gray-600">
                <li className="flex gap-2"><span className="text-gray-400">□</span> Shows "Showing 1–5 of 20"</li>
                <li className="flex gap-2"><span className="text-gray-400">□</span> Next/Prev navigate correctly</li>
                <li className="flex gap-2"><span className="text-gray-400">□</span> First/Last jump to bounds</li>
                <li className="flex gap-2"><span className="text-gray-400">□</span> Prev/First disabled on page 1</li>
                <li className="flex gap-2"><span className="text-gray-400">□</span> Next/Last disabled on last page</li>
                <li className="flex gap-2"><span className="text-gray-400">□</span> Change page size: resets to page 1</li>
                <li className="flex gap-2"><span className="text-gray-400">□</span> Filter reduces pages: auto-clamps</li>
                <li className="flex gap-2"><span className="text-gray-400">□</span> Empty results: "Page 1 of 1" shown</li>
              </ul>
            </div>

            {/* Interaction Tests */}
            <div>
              <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold">I</span>
                Interactions
              </h3>
              <ul className="space-y-1.5 text-sm text-gray-600">
                <li className="flex gap-2"><span className="text-gray-400">□</span> Sort → Filter → Paginate order</li>
                <li className="flex gap-2"><span className="text-gray-400">□</span> Go to page 3, filter, verify page 1</li>
                <li className="flex gap-2"><span className="text-gray-400">□</span> Sort by Price, filter "elec", verify sorted</li>
                <li className="flex gap-2"><span className="text-gray-400">□</span> Filter, sort, change page size, verify</li>
              </ul>
            </div>

            {/* Accessibility Tests */}
            <div>
              <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-pink-100 text-pink-700 rounded-full flex items-center justify-center text-xs font-bold">A</span>
                Accessibility
              </h3>
              <ul className="space-y-1.5 text-sm text-gray-600">
                <li className="flex gap-2"><span className="text-gray-400">□</span> Tab through all interactive elements</li>
                <li className="flex gap-2"><span className="text-gray-400">□</span> Screen reader: aria-sort announced</li>
                <li className="flex gap-2"><span className="text-gray-400">□</span> Focus visible on all buttons/inputs</li>
                <li className="flex gap-2"><span className="text-gray-400">□</span> Table has proper role="grid"</li>
              </ul>
            </div>

            {/* Edge Cases */}
            <div>
              <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-xs font-bold">E</span>
                Edge Cases
              </h3>
              <ul className="space-y-1.5 text-sm text-gray-600">
                <li className="flex gap-2"><span className="text-gray-400">□</span> Filter to 0 results, then clear</li>
                <li className="flex gap-2"><span className="text-gray-400">□</span> Rapid filter typing (no flicker)</li>
                <li className="flex gap-2"><span className="text-gray-400">□</span> Filter with leading/trailing spaces</li>
                <li className="flex gap-2"><span className="text-gray-400">□</span> Click non-sortable column (if any)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
