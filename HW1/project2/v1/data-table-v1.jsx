import React, { useState, useMemo } from 'react';

// Sample data type
interface Person {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
  salary: number;
  startDate: string;
}

// Sample data
const sampleData: Person[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', department: 'Engineering', role: 'Senior Developer', salary: 95000, startDate: '2020-03-15' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', department: 'Marketing', role: 'Marketing Manager', salary: 78000, startDate: '2019-07-22' },
  { id: 3, name: 'Carol Williams', email: 'carol@example.com', department: 'Engineering', role: 'Tech Lead', salary: 115000, startDate: '2018-01-10' },
  { id: 4, name: 'David Brown', email: 'david@example.com', department: 'Sales', role: 'Sales Representative', salary: 62000, startDate: '2021-05-03' },
  { id: 5, name: 'Eva Martinez', email: 'eva@example.com', department: 'HR', role: 'HR Specialist', salary: 58000, startDate: '2020-11-18' },
  { id: 6, name: 'Frank Garcia', email: 'frank@example.com', department: 'Engineering', role: 'Junior Developer', salary: 65000, startDate: '2022-02-28' },
  { id: 7, name: 'Grace Lee', email: 'grace@example.com', department: 'Finance', role: 'Financial Analyst', salary: 72000, startDate: '2019-09-14' },
  { id: 8, name: 'Henry Wilson', email: 'henry@example.com', department: 'Engineering', role: 'DevOps Engineer', salary: 98000, startDate: '2020-06-01' },
  { id: 9, name: 'Ivy Chen', email: 'ivy@example.com', department: 'Design', role: 'UX Designer', salary: 82000, startDate: '2021-01-25' },
  { id: 10, name: 'Jack Taylor', email: 'jack@example.com', department: 'Sales', role: 'Sales Manager', salary: 88000, startDate: '2017-12-05' },
  { id: 11, name: 'Karen Davis', email: 'karen@example.com', department: 'Marketing', role: 'Content Writer', salary: 55000, startDate: '2022-04-11' },
  { id: 12, name: 'Leo Anderson', email: 'leo@example.com', department: 'Engineering', role: 'QA Engineer', salary: 70000, startDate: '2020-08-20' },
  { id: 13, name: 'Mia Thompson', email: 'mia@example.com', department: 'HR', role: 'HR Manager', salary: 85000, startDate: '2016-03-30' },
  { id: 14, name: 'Nathan White', email: 'nathan@example.com', department: 'Finance', role: 'Accountant', salary: 68000, startDate: '2021-07-07' },
  { id: 15, name: 'Olivia Harris', email: 'olivia@example.com', department: 'Design', role: 'Graphic Designer', salary: 60000, startDate: '2022-01-15' },
];

type SortDirection = 'asc' | 'desc' | null;
type SortKey = keyof Person | null;

export default function DataTable() {
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Filter data
  const filteredData = useMemo(() => {
    if (!filter) return sampleData;
    const lowerFilter = filter.toLowerCase();
    return sampleData.filter(person =>
      Object.values(person).some(value =>
        String(value).toLowerCase().includes(lowerFilter)
      )
    );
  }, [filter]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return filteredData;
    
    return [...filteredData].sort((a, b) => {
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
  }, [filteredData, sortKey, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  // Handle sort
  const handleSort = (key: keyof Person) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Get sort indicator
  const getSortIndicator = (key: keyof Person) => {
    if (sortKey !== key) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // Reset to page 1 when filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
    setCurrentPage(1);
  };

  const columns: { key: keyof Person; label: string }[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'department', label: 'Department' },
    { key: 'role', label: 'Role' },
    { key: 'salary', label: 'Salary' },
    { key: 'startDate', label: 'Start Date' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Employee Directory</h1>
      
      {/* Filter Input */}
      <div className="mb-4 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search all columns..."
            value={filter}
            onChange={handleFilterChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {filter && (
            <button
              onClick={() => { setFilter(''); setCurrentPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        <span className="text-sm text-gray-500">
          {sortedData.length} result{sortedData.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    <span className="text-gray-400 text-xs">{getSortIndicator(col.key)}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                  No results found
                </td>
              </tr>
            ) : (
              paginatedData.map(person => (
                <tr key={person.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{person.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{person.email}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {person.department}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{person.role}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                    ${person.salary.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{person.startDate}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Rows per page:</label>
          <select
            value={rowsPerPage}
            onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages || 1}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              «
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ‹
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              »
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
