import { DataTable } from './components/DataTable/DataTable';
import { sampleProducts, productColumns } from './data/sampleData';

function App() {
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
      </div>
    </div>
  );
}

export default App;
