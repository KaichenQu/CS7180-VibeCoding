import React, { useState, useMemo, useCallback, useRef } from "react";
import type {
  RowData,
  SortDirection,
  SortState,
  ColumnDefinition,
  DataTableProps,
  IndexedRow,
} from "./DataTable.types";
import { compareValues, clamp } from "./DataTable.utils";

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
// DATA TABLE COMPONENT
// ════════════════════════════════════════════════════════════════════════════════

export function DataTable<T extends RowData>({
  data,
  columns,
  initialPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  caption,
  className = "",
}: DataTableProps<T>): JSX.Element {
  // ─────────────────────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────────────────────

  const [filterText, setFilterText] = useState("");
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
      }),
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
  const handleSort = useCallback(
    (columnKey: keyof T) => {
      setSortState((prev) => {
        let newDirection: SortDirection;
        let announcement: string;

        if (prev.columnKey !== columnKey) {
          // New column: start with ascending
          newDirection = "asc";
          announcement = `Sorted ascending`;
        } else if (prev.direction === null) {
          newDirection = "asc";
          announcement = `Sorted ascending`;
        } else if (prev.direction === "asc") {
          newDirection = "desc";
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
    },
    [announce],
  );

  /** Handle keyboard events on sortable headers */
  const handleHeaderKeyDown = useCallback(
    (e: React.KeyboardEvent, columnKey: keyof T) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleSort(columnKey);
      }
    },
    [handleSort],
  );

  /** Handle filter input change */
  const handleFilterChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilterText(e.target.value);
      setCurrentPage(1); // Reset to page 1 on filter change
    },
    [],
  );

  /** Clear filter */
  const handleClearFilter = useCallback(() => {
    setFilterText("");
    setCurrentPage(1);
  }, []);

  /** Handle page size change */
  const handlePageSizeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setPageSize(Number(e.target.value));
      setCurrentPage(1); // Reset to page 1 on page size change
    },
    [],
  );

  /** Navigate to specific page */
  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(clamp(page, 1, totalPages));
    },
    [totalPages],
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  /** Get sort indicator for column */
  const getSortIndicator = (
    columnKey: keyof T,
    isSortable: boolean,
  ): React.ReactNode => {
    if (!isSortable) return null;

    const isActive = sortState.columnKey === columnKey;
    const direction = isActive ? sortState.direction : null;

    return (
      <span
        className={`ml-2 inline-flex w-4 justify-center ${isActive ? "text-blue-600" : "text-gray-400"}`}
        aria-hidden="true"
      >
        {direction === "asc" && "↑"}
        {direction === "desc" && "↓"}
        {direction === null && "—"}
      </span>
    );
  };

  /** Render cell content */
  const renderCell = (
    row: T,
    col: ColumnDefinition<T>,
    rowIndex: number,
  ): React.ReactNode => {
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
  const getAlignClass = (align?: "left" | "center" | "right"): string => {
    switch (align) {
      case "center":
        return "text-center";
      case "right":
        return "text-right";
      default:
        return "text-left";
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
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
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
            "No results"
          ) : (
            <>
              Showing{" "}
              <span className="font-medium">
                {startItem}–{endItem}
              </span>{" "}
              of <span className="font-medium">{totalRows}</span>
              {filterText && (
                <span className="text-gray-500">
                  {" "}
                  (filtered from {data.length})
                </span>
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
          {caption && <caption className="sr-only">{caption}</caption>}

          <thead className="bg-gray-50">
            <tr role="row">
              {columns.map((col) => {
                const isSortable = col.sortable !== false;
                const isCurrentSort = sortState.columnKey === col.key;
                const ariaSortValue = isCurrentSort
                  ? sortState.direction === "asc"
                    ? "ascending"
                    : sortState.direction === "desc"
                      ? "descending"
                      : "none"
                  : "none";

                return (
                  <th
                    key={String(col.key)}
                    role="columnheader"
                    scope="col"
                    tabIndex={isSortable ? 0 : undefined}
                    onClick={isSortable ? () => handleSort(col.key) : undefined}
                    onKeyDown={
                      isSortable
                        ? (e) => handleHeaderKeyDown(e, col.key)
                        : undefined
                    }
                    aria-sort={isSortable ? ariaSortValue : undefined}
                    className={`px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-600
                                ${getAlignClass(col.align)}
                                ${isSortable ? "cursor-pointer select-none hover:bg-gray-100 focus:outline-none focus:bg-blue-50 focus:ring-2 focus:ring-inset focus:ring-blue-500" : ""}`}
                    style={{ width: col.width }}
                  >
                    <div
                      className={`flex items-center ${col.align === "right" ? "justify-end" : col.align === "center" ? "justify-center" : ""}`}
                    >
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
                <td colSpan={columns.length} className="px-4 py-16 text-center">
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
                      {filterText ? "No matching results" : "No data available"}
                    </p>
                    {filterText && (
                      <button
                        onClick={handleClearFilter}
                        aria-label="Clear filter and show all results"
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
            Page <span className="font-medium">{effectivePage}</span> of{" "}
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
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
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
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
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
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
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
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </nav>
    </div>
  );
}
