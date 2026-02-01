import { DataTable } from './components/DataTable';
import { sampleEmployees } from './data/sampleEmployees';
import { employeeColumns } from './data/employeeColumns';

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
