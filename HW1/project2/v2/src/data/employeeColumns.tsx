import { ColumnDef } from '../types/dataTable.types';
import { Employee } from './sampleEmployees';

/** Column definitions for Employee table */
export const employeeColumns: ColumnDef<Employee>[] = [
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
