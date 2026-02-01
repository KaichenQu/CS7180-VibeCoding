import React, { useState, useMemo, useCallback } from 'react';

// ============================================
// TYPE DEFINITIONS
// ============================================

/** Generic row data model - must have an id */
interface BaseRow {
  id: string | number;
}

/** Sort direction state */
type SortDirection = 'asc' | 'desc' | null;

/** Sort state tracking current column and direction */
interface SortState<T extends BaseRow> {
  key: keyof T | null;
  direction: SortDirection;
}

/** Pagination state */
interface PaginationState {
  currentPage: number;
  pageSize: number;
}

/** Column definition with optional render and sortable config */
interface ColumnDef<T extends BaseRow> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  sortable?: boolean; // defaults to true if not specified
  width?: string;
}

/** Props for the DataTable component */
interface DataTableProps<T extends BaseRow> {
  data: T[];
  columns: ColumnDef<T>[];
  initialPageSize?: number;
  pageSizeOptions?: number[];
}

// ============================================
// DATA TABLE COMPONENT
// ============================================

function DataTable<T extends BaseRow>({
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

  // ----------------------------------------
  // STEP 2: SORT
  // ----------------------------------------
  const sortedData = useMemo(() => {
    const { key, direction } = sortState;
    if (!key || !direction) return filteredData;

    return [...filteredData].sort((a, b) => {
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
  }, [filteredData, sortState]);

  // ----------------------------------------
  // STEP 3: PAGINATE
  // ----------------------------------------
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pagination.pageSize));

  // Clamp current page to valid range
  const effectivePage = Math.min(Math.max(1, pagination.currentPage), totalPages);

  const paginatedData = useMemo(() => {
    const startIndex = (effectivePage - 1) * pagination.pageSize;
    return sortedData.slice(startIndex, startIndex + pagination.pageSize);
  }, [sortedData, effectivePage, pagination.pageSize]);

  // ----------------------------------------
  // EVENT HANDLERS
  // ----------------------------------------

  const handleSort = useCallback((key: keyof T) => {
    setSortState((prev) => {
      if (prev.key !== key) {
        return { key, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      // Reset sort
      return { key: null, direction: null };
    });
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
      currentPage: Math.min(Math.max(1, page), totalPages),
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

// ============================================
// EXAMPLE USAGE WITH SAMPLE DATA
// ============================================

/** Employee data model */
interface Employee extends BaseRow {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
  salary: number;
  startDate: string;
  isActive: boolean;
}

/** Sample employee data */
const sampleEmployees: Employee[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@acme.com', department: 'Engineering', role: 'Senior Developer', salary: 95000, startDate: '2020-03-15', isActive: true },
  { id: 2, name: 'Bob Smith', email: 'bob@acme.com', department: 'Marketing', role: 'Marketing Manager', salary: 78000, startDate: '2019-07-22', isActive: true },
  { id: 3, name: 'Carol Williams', email: 'carol@acme.com', department: 'Engineering', role: 'Tech Lead', salary: 115000, startDate: '2018-01-10', isActive: true },
  { id: 4, name: 'David Brown', email: 'david@acme.com', department: 'Sales', role: 'Sales Rep', salary: 62000, startDate: '2021-05-03', isActive: false },
  { id: 5, name: 'Eva Martinez', email: 'eva@acme.com', department: 'HR', role: 'HR Specialist', salary: 58000, startDate: '2020-11-18', isActive: true },
  { id: 6, name: 'Frank Garcia', email: 'frank@acme.com', department: 'Engineering', role: 'Junior Developer', salary: 65000, startDate: '2022-02-28', isActive: true },
  { id: 7, name: 'Grace Lee', email: 'grace@acme.com', department: 'Finance', role: 'Financial Analyst', salary: 72000, startDate: '2019-09-14', isActive: true },
  { id: 8, name: 'Henry Wilson', email: 'henry@acme.com', department: 'Engineering', role: 'DevOps Engineer', salary: 98000, startDate: '2020-06-01', isActive: true },
  { id: 9, name: 'Ivy Chen', email: 'ivy@acme.com', department: 'Design', role: 'UX Designer', salary: 82000, startDate: '2021-01-25', isActive: true },
  { id: 10, name: 'Jack Taylor', email: 'jack@acme.com', department: 'Sales', role: 'Sales Manager', salary: 88000, startDate: '2017-12-05', isActive: true },
  { id: 11, name: 'Karen Davis', email: 'karen@acme.com', department: 'Marketing', role: 'Content Writer', salary: 55000, startDate: '2022-04-11', isActive: false },
  { id: 12, name: 'Leo Anderson', email: 'leo@acme.com', department: 'Engineering', role: 'QA Engineer', salary: 70000, startDate: '2020-08-20', isActive: true },
  { id: 13, name: 'Mia Thompson', email: 'mia@acme.com', department: 'HR', role: 'HR Manager', salary: 85000, startDate: '2016-03-30', isActive: true },
  { id: 14, name: 'Nathan White', email: 'nathan@acme.com', department: 'Finance', role: 'Accountant', salary: 68000, startDate: '2021-07-07', isActive: true },
  { id: 15, name: 'Olivia Harris', email: 'olivia@acme.com', department: 'Design', role: 'Graphic Designer', salary: 60000, startDate: '2022-01-15', isActive: true },
  { id: 16, name: 'Peter Clark', email: 'peter@acme.com', department: 'Engineering', role: 'Architect', salary: 130000, startDate: '2015-08-01', isActive: true },
  { id: 17, name: 'Quinn Roberts', email: 'quinn@acme.com', department: 'Sales', role: 'Account Executive', salary: 75000, startDate: '2023-01-09', isActive: true },
];

/** Column definitions for Employee table */
const employeeColumns: ColumnDef<Employee>[] = [
  { key: 'name', header: 'Name', width: '180px' },
  { key: 'email', header: 'Email' },
  {
    key: 'department',
    header: 'Department',
    render: (value) => (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
        {String(value)}
      </span>
    ),
  },
  { key: 'role', header: 'Role' },
  {
    key: 'salary',
    header: 'Salary',
    render: (value) => (
      <span className="font-mono">${Number(value).toLocaleString()}</span>
    ),
  },
  {
    key: 'startDate',
    header: 'Start Date',
    render: (value) => new Date(String(value)).toLocaleDateString(),
  },
  {
    key: 'isActive',
    header: 'Status',
    render: (value) => (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}
      >
        {value ? 'Active' : 'Inactive'}
      </span>
    ),
    sortable: false, // Disable sorting for this column
  },
];

/** Main App component */
export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Employee Directory</h1>
        <p className="text-gray-600 mb-6">V2: Typed columns, custom renderers, configurable sorting</p>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <DataTable
            data={sampleEmployees}
            columns={employeeColumns}
            initialPageSize={5}
            pageSizeOptions={[5, 10, 15, 20]}
          />
        </div>

        {/* Edge Cases Documentation */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Edge Cases Handled</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span><strong>Empty data:</strong> Shows "No data available" message</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span><strong>No filter matches:</strong> Shows "No matching rows found" with filter context</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span><strong>Page overflow:</strong> Current page clamped to valid range when filter reduces results</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span><strong>Null/undefined values:</strong> Sorted consistently (nulls first in asc, last in desc)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span><strong>Mixed types:</strong> Numbers sorted numerically, dates parsed from ISO strings, rest as strings</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span><strong>Sort cycle:</strong> asc → desc → none (clear sort)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span><strong>Filter resets page:</strong> Changing filter or page size resets to page 1</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span><strong>Non-sortable columns:</strong> Columns can opt out via <code className="bg-gray-100 px-1 rounded">sortable: false</code></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span><strong>Custom rendering:</strong> Columns support custom render functions for formatting</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span><strong>Accessible:</strong> ARIA attributes for sort state, labeled inputs and buttons</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
