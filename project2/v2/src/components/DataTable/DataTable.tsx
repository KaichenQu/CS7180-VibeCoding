import { useState, useMemo, useCallback } from 'react';
import { BaseRow, ColumnDef, DataTableProps, SortState, PaginationState } from '../../types/dataTable.types';
import { filterData } from '../../utils/filtering';
import { sortData, getNextSortState } from '../../utils/sorting';
import { calculateTotalPages, clampPage, paginateData } from '../../utils/pagination';

// ============================================
// DATA TABLE COMPONENT
// ============================================

export function DataTable<T extends BaseRow>({
  data,
  columns,
  initialPageSize = 5,
  pageSizeOptions = [5, 10, 20, 50],
}: DataTableProps<T>) {
  // Filter state
  const [filterText, setFilterText] = useState('');

  // Sort state
  const [sortState, setSortState] = useState<SortState<T>>({
    key: null,
    direction: null,
  });

  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: initialPageSize,
  });

  // ----------------------------------------
  // STEP 1: FILTER
  // ----------------------------------------
  const filteredData = useMemo(() => {
    return filterData(data, columns, filterText);
  }, [data, columns, filterText]);

  // ----------------------------------------
  // STEP 2: SORT
  // ----------------------------------------
  const sortedData = useMemo(() => {
    return sortData(filteredData, sortState);
  }, [filteredData, sortState]);

  // ----------------------------------------
  // STEP 3: PAGINATE
  // ----------------------------------------
  const totalPages = calculateTotalPages(sortedData.length, pagination.pageSize);

  // Clamp current page to valid range
  const effectivePage = clampPage(pagination.currentPage, totalPages);

  const paginatedData = useMemo(() => {
    return paginateData(sortedData, effectivePage, pagination.pageSize);
  }, [sortedData, effectivePage, pagination.pageSize]);

  // ----------------------------------------
  // EVENT HANDLERS
  // ----------------------------------------

  const handleSort = useCallback((key: keyof T) => {
    setSortState((prev) => getNextSortState(prev, key));
  }, []);

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterText(e.target.value);
    // Reset to page 1 when filter changes
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, []);

  const handlePageSizeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = Number(e.target.value);
    setPagination({ currentPage: 1, pageSize: newSize });
  }, []);

  const goToPage = useCallback((page: number) => {
    setPagination((prev) => ({
      ...prev,
      currentPage: clampPage(page, totalPages),
    }));
  }, [totalPages]);

  // ----------------------------------------
  // RENDER HELPERS
  // ----------------------------------------

  const getSortIcon = (key: keyof T, sortable: boolean) => {
    if (!sortable) return null;
    if (sortState.key !== key) {
      return <span className="ml-1 text-gray-300">⇅</span>;
    }
    return (
      <span className="ml-1 text-blue-600">
        {sortState.direction === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  const renderCell = (row: T, col: ColumnDef<T>) => {
    const value = row[col.key];
    if (col.render) {
      return col.render(value, row);
    }
    if (value === null || value === undefined) {
      return <span className="text-gray-400">—</span>;
    }
    return String(value);
  };

  // ----------------------------------------
  // RENDER
  // ----------------------------------------

  return (
    <div className="w-full">
      {/* Filter Input */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative">
          <input
            type="text"
            value={filterText}
            onChange={handleFilterChange}
            placeholder="Filter rows..."
            className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-72"
            aria-label="Filter table rows"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {filterText && (
            <button
              onClick={() => { setFilterText(''); setPagination(p => ({ ...p, currentPage: 1 })); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              aria-label="Clear filter"
            >
              ×
            </button>
          )}
        </div>
        <div className="text-sm text-gray-500">
          Showing {paginatedData.length} of {sortedData.length} rows
          {filterText && ` (filtered from ${data.length})`}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => {
                const isSortable = col.sortable !== false;
                return (
                  <th
                    key={String(col.key)}
                    onClick={isSortable ? () => handleSort(col.key) : undefined}
                    className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${
                      isSortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''
                    }`}
                    style={{ width: col.width }}
                    aria-sort={
                      sortState.key === col.key
                        ? sortState.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    <div className="flex items-center">
                      {col.header}
                      {getSortIcon(col.key, isSortable)}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-gray-500"
                >
                  {filterText ? 'No matching rows found' : 'No data available'}
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  {columns.map((col) => (
                    <td
                      key={`${row.id}-${String(col.key)}`}
                      className="px-4 py-3 text-sm text-gray-700"
                    >
                      {renderCell(row, col)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="pageSize" className="text-sm text-gray-600">
            Rows per page:
          </label>
          <select
            id="pageSize"
            value={pagination.pageSize}
            onChange={handlePageSizeChange}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-600 mr-2">
            Page {effectivePage} of {totalPages}
          </span>
          <button
            onClick={() => goToPage(1)}
            disabled={effectivePage <= 1}
            className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="First page"
          >
            ««
          </button>
          <button
            onClick={() => goToPage(effectivePage - 1)}
            disabled={effectivePage <= 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            ‹
          </button>
          <button
            onClick={() => goToPage(effectivePage + 1)}
            disabled={effectivePage >= totalPages}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            ›
          </button>
          <button
            onClick={() => goToPage(totalPages)}
            disabled={effectivePage >= totalPages}
            className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Last page"
          >
            »»
          </button>
        </div>
      </div>
    </div>
  );
}
